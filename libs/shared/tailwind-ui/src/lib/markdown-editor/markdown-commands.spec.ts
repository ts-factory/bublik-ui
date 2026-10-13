/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	type TextEdit,
	type TextState,
	bold,
	bulletList,
	code,
	continueList,
	link,
	linkPastedUrl,
	numberedList,
	quote,
	taskList
} from './markdown-commands';

/**
 * State from a string with `|` marking the caret, or two `|` marking the
 * selection.
 */
function state(marked: string): TextState {
	const first = marked.indexOf('|');
	const second = marked.indexOf('|', first + 1);
	const value = marked.replace(/\|/g, '');

	return {
		value,
		selectionStart: first,
		selectionEnd: second === -1 ? first : second - 1
	};
}

/** The text after the edit, with the new selection marked as `state` reads it. */
function apply(before: TextState, edit: TextEdit | null): string {
	if (!edit) return 'null';

	const value =
		before.value.slice(0, edit.start) +
		edit.text +
		before.value.slice(edit.end);
	const { selectionStart: s, selectionEnd: e } = edit;

	if (s === e) return `${value.slice(0, s)}|${value.slice(s)}`;

	return `${value.slice(0, s)}|${value.slice(s, e)}|${value.slice(e)}`;
}

function run(
	command: (state: TextState) => TextEdit | null,
	marked: string
): string {
	const before = state(marked);

	return apply(before, command(before));
}

describe('bold', () => {
	it('wraps the selection and keeps it selected', () => {
		expect(run(bold, 'a |word| b')).toBe('a **|word|** b');
	});

	it('inserts empty markers with the caret between them', () => {
		expect(run(bold, 'a |')).toBe('a **|**');
	});

	it('unwraps markers just outside the selection', () => {
		expect(run(bold, 'a **|word|** b')).toBe('a |word| b');
	});

	it('unwraps markers inside the selection', () => {
		expect(run(bold, 'a |**word**| b')).toBe('a |word| b');
	});
});

describe('code', () => {
	it('wraps a single line in backticks', () => {
		expect(run(code, '|x = 1|')).toBe('`|x = 1|`');
	});

	it('fences a selection that spans lines', () => {
		expect(run(code, '|a\nb|')).toBe('```\n|a\nb|\n```');
	});
});

describe('link', () => {
	it('links the selected text and selects the url placeholder', () => {
		expect(run(link, 'see |docs|')).toBe('see [docs](|url|)');
	});

	it('puts a selected url in the parentheses', () => {
		expect(run(link, '|https://x.io|')).toBe('[|](https://x.io)');
	});
});

describe('linkPastedUrl', () => {
	it('links the selected text to a pasted url', () => {
		const before = state('see |docs|');

		expect(apply(before, linkPastedUrl(before, 'https://x.io'))).toBe(
			'see [docs](https://x.io)|'
		);
	});

	it('leaves pasting over nothing, or pasting non-urls, alone', () => {
		expect(linkPastedUrl(state('see |'), 'https://x.io')).toBeNull();
		expect(linkPastedUrl(state('|docs|'), 'not a url')).toBeNull();
	});
});

describe('line prefixes', () => {
	it('prefixes every selected line, skipping blank ones', () => {
		expect(run(bulletList, '|a\n\nb|')).toBe('|- a\n\n- b|');
	});

	it('numbers the lines in order', () => {
		expect(run(numberedList, 'x|a\nb|')).toBe('|1. xa\n2. b|');
	});

	it('removes the prefix when every line has it', () => {
		expect(run(quote, '|> a\n> b|')).toBe('|a\nb|');
	});

	it('leaves the caret after a prefix put on an empty line', () => {
		expect(run(taskList, 'a\n|')).toBe('a\n- [ ] |');
	});
});

describe('continueList', () => {
	it('starts the next bullet', () => {
		expect(run(continueList, '- a|')).toBe('- a\n- |');
	});

	it('counts a numbered list up and keeps the indent', () => {
		expect(run(continueList, '  9. a|')).toBe('  9. a\n  10. |');
	});

	it('starts the next task unchecked', () => {
		expect(run(continueList, '- [x] a|')).toBe('- [x] a\n- [ ] |');
	});

	it('ends the list on an empty item, after a blank line', () => {
		expect(run(continueList, '- a\n- |')).toBe('- a\n\n|');
	});

	it('does nothing outside a list', () => {
		expect(run(continueList, 'plain|')).toBe('null');
	});
});
