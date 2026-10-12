/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

/** The textarea's text and selection, as a command reads them. */
export interface TextState {
	value: string;
	selectionStart: number;
	selectionEnd: number;
}

/**
 * Replace `[start, end)` with `text`, then select `[selectionStart,
 * selectionEnd)` in the result. One replacement per command, so it can go
 * through the browser's own text insertion and land as one undo step.
 */
export interface TextEdit {
	start: number;
	end: number;
	text: string;
	selectionStart: number;
	selectionEnd: number;
}

export type MarkdownCommand = (state: TextState) => TextEdit;

/**
 * Wrap the selection in `prefix`/`suffix`, or unwrap it when it already is —
 * either the selection holds the markers or they sit just outside it. With
 * nothing selected the markers go in empty with the caret between them.
 */
export function wrapSelection(
	state: TextState,
	prefix: string,
	suffix = prefix
): TextEdit {
	const { value, selectionStart: start, selectionEnd: end } = state;
	const selected = value.slice(start, end);

	if (
		selected.length >= prefix.length + suffix.length &&
		selected.startsWith(prefix) &&
		selected.endsWith(suffix)
	) {
		const inner = selected.slice(
			prefix.length,
			selected.length - suffix.length
		);

		return replace(start, end, inner, start, start + inner.length);
	}

	if (
		value.slice(start - prefix.length, start) === prefix &&
		value.slice(end, end + suffix.length) === suffix
	) {
		const outerStart = start - prefix.length;

		return replace(
			outerStart,
			end + suffix.length,
			selected,
			outerStart,
			outerStart + selected.length
		);
	}

	const caret = start + prefix.length;

	return replace(
		start,
		end,
		`${prefix}${selected}${suffix}`,
		caret,
		caret + selected.length
	);
}

export const bold: MarkdownCommand = (state) => wrapSelection(state, '**');

export const italic: MarkdownCommand = (state) => wrapSelection(state, '_');

/** Inline code, or a fenced block when the selection spans lines. */
export const code: MarkdownCommand = (state) => {
	const selected = state.value.slice(state.selectionStart, state.selectionEnd);

	if (!selected.includes('\n')) return wrapSelection(state, '`');

	return wrapSelection(state, '```\n', '\n```');
};

const URL_PATTERN = /^https?:\/\/\S+$/;

export function isUrl(text: string): boolean {
	return URL_PATTERN.test(text.trim());
}

/**
 * `[selection](url)` with `url` selected to type over. A selected URL goes in
 * the parentheses instead, with the caret left in the empty brackets.
 */
export const link: MarkdownCommand = (state) => {
	const { value, selectionStart: start, selectionEnd: end } = state;
	const selected = value.slice(start, end);

	if (isUrl(selected)) {
		return replace(start, end, `[](${selected})`, start + 1, start + 1);
	}

	const text = `[${selected}](url)`;
	const urlStart = start + selected.length + 3;

	return replace(start, end, text, urlStart, urlStart + 3);
};

/** `[selection](url)` for a URL pasted over selected text, else nothing. */
export function linkPastedUrl(
	state: TextState,
	pasted: string
): TextEdit | null {
	const { value, selectionStart: start, selectionEnd: end } = state;
	const selected = value.slice(start, end);

	if (!selected || selected.includes('\n')) return null;
	if (!isUrl(pasted) || isUrl(selected)) return null;

	const text = `[${selected}](${pasted.trim()})`;

	return replace(start, end, text, start + text.length, start + text.length);
}

/**
 * Prefix every line the selection touches, or strip the prefix when every
 * non-blank line already has it. `prefixFor` gets the line's position among
 * the prefixed ones, so a numbered list counts up.
 */
function toggleLinePrefix(
	state: TextState,
	prefixFor: (index: number) => string,
	existing: RegExp
): TextEdit {
	const { value, selectionStart, selectionEnd } = state;
	const start = lineStartOf(value, selectionStart);
	const lineEnd = value.indexOf('\n', selectionEnd);
	const end = lineEnd === -1 ? value.length : lineEnd;
	const lines = value.slice(start, end).split('\n');
	const filled = lines.filter((line) => line.trim() !== '');
	const remove =
		filled.length > 0 && filled.every((line) => existing.test(line));

	let index = 0;
	const next = lines
		.map((line) => {
			if (remove) return line.replace(existing, '');
			if (line.trim() === '' && lines.length > 1) return line;

			return `${prefixFor(index++)}${line}`;
		})
		.join('\n');

	// A single empty line keeps the caret after the new prefix; otherwise the
	// touched lines stay selected, so the command can be toggled back.
	if (lines.length === 1 && lines[0] === '') {
		return replace(start, end, next, start + next.length, start + next.length);
	}

	return replace(start, end, next, start, start + next.length);
}

export const quote: MarkdownCommand = (state) =>
	toggleLinePrefix(state, () => '> ', /^> ?/);

export const bulletList: MarkdownCommand = (state) =>
	toggleLinePrefix(state, () => '- ', /^[-*+] /);

export const numberedList: MarkdownCommand = (state) =>
	toggleLinePrefix(state, (index) => `${index + 1}. `, /^\d+\. /);

export const taskList: MarkdownCommand = (state) =>
	toggleLinePrefix(state, () => '- [ ] ', /^[-*+] \[[ xX]\] /);

export const heading: MarkdownCommand = (state) =>
	toggleLinePrefix(state, () => '### ', /^#{1,6} /);

const LIST_ITEM = /^(\s*)([-*+]|(\d+)\.)( +)(\[[ xX]\] +)?/;

/**
 * Enter inside a list item: start the next item with the same marker (a
 * numbered one counts up, a task one comes unchecked). Enter on an item with
 * nothing after its marker ends the list: the marker gives way to a blank
 * line, without which the next line would read as part of the last item.
 * Anywhere else, nothing — the newline goes in as usual.
 */
export function continueList(state: TextState): TextEdit | null {
	const { value, selectionStart, selectionEnd } = state;

	if (selectionStart !== selectionEnd) return null;

	const lineStart = lineStartOf(value, selectionStart);
	const lineEndIndex = value.indexOf('\n', selectionStart);
	const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;
	const line = value.slice(lineStart, lineEnd);
	const match = LIST_ITEM.exec(line);

	if (!match) return null;

	const marker = match[0];

	// The caret sits inside the marker; let the newline split it as text.
	if (selectionStart < lineStart + marker.length) return null;

	if (line.slice(marker.length).trim() === '') {
		return replace(lineStart, lineEnd, '\n', lineStart + 1, lineStart + 1);
	}

	const [, indent, bullet, number, spacing, task] = match;
	const nextBullet = number ? `${Number(number) + 1}.` : bullet;
	const text = `\n${indent}${nextBullet}${spacing}${task ? '[ ] ' : ''}`;
	const caret = selectionStart + text.length;

	return replace(selectionStart, selectionStart, text, caret, caret);
}

/** `lastIndexOf` reads a negative start as 0, which would find a leading newline. */
function lineStartOf(value: string, index: number): number {
	return index === 0 ? 0 : value.lastIndexOf('\n', index - 1) + 1;
}

function replace(
	start: number,
	end: number,
	text: string,
	selectionStart: number,
	selectionEnd: number
): TextEdit {
	return { start, end, text, selectionStart, selectionEnd };
}
