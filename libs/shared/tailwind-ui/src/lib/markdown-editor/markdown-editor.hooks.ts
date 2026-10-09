/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	type ClipboardEvent,
	type KeyboardEvent,
	type RefObject,
	useCallback,
	useLayoutEffect
} from 'react';

import {
	type MarkdownCommand,
	type TextEdit,
	bold,
	bulletList,
	code,
	continueList,
	italic,
	link,
	linkPastedUrl,
	numberedList
} from './markdown-commands';

/**
 * Write the edit into the textarea the way typing would. `insertText` puts it
 * on the browser's undo stack and fires `input`, so ⌘Z takes a toolbar edit
 * back and React sees the change. Where `insertText` is missing (jsdom) the
 * text is set directly and `input` fired by hand.
 */
function applyEdit(textarea: HTMLTextAreaElement, edit: TextEdit) {
	textarea.focus();
	textarea.setSelectionRange(edit.start, edit.end);

	const inserted =
		typeof document.execCommand === 'function' &&
		document.execCommand('insertText', false, edit.text);

	if (!inserted) {
		textarea.setRangeText(edit.text, edit.start, edit.end, 'end');
		textarea.dispatchEvent(new Event('input', { bubbles: true }));
	}

	textarea.setSelectionRange(edit.selectionStart, edit.selectionEnd);
}

function readState(textarea: HTMLTextAreaElement) {
	return {
		value: textarea.value,
		selectionStart: textarea.selectionStart,
		selectionEnd: textarea.selectionEnd
	};
}

/** ⌘/Ctrl shortcuts, keyed by `KeyboardEvent.code` so Shift does not move them. */
const SHORTCUTS: Record<string, MarkdownCommand> = {
	KeyB: bold,
	KeyI: italic,
	KeyE: code,
	KeyK: link
};

const SHIFT_SHORTCUTS: Record<string, MarkdownCommand> = {
	Digit7: numberedList,
	Digit8: bulletList
};

/** Runs markdown commands against a textarea, and the keys that trigger them. */
export function useMarkdownCommands(ref: RefObject<HTMLTextAreaElement>) {
	const run = useCallback(
		(command: MarkdownCommand) => {
			const textarea = ref.current;

			if (!textarea || textarea.disabled || textarea.readOnly) return;

			applyEdit(textarea, command(readState(textarea)));
		},
		[ref]
	);

	const onKeyDown = useCallback((event: KeyboardEvent<HTMLTextAreaElement>) => {
		const textarea = event.currentTarget;

		if (event.key === 'Enter' && !event.shiftKey && !hasModifier(event)) {
			if (event.nativeEvent.isComposing) return;

			const edit = continueList(readState(textarea));

			if (!edit) return;

			event.preventDefault();
			applyEdit(textarea, edit);
			return;
		}

		if (!(event.metaKey || event.ctrlKey) || event.altKey) return;

		const command = event.shiftKey
			? SHIFT_SHORTCUTS[event.code]
			: SHORTCUTS[event.code];

		if (!command) return;

		event.preventDefault();
		applyEdit(textarea, command(readState(textarea)));
	}, []);

	const onPaste = useCallback((event: ClipboardEvent<HTMLTextAreaElement>) => {
		const textarea = event.currentTarget;
		const edit = linkPastedUrl(
			readState(textarea),
			event.clipboardData.getData('text/plain')
		);

		if (!edit) return;

		event.preventDefault();
		applyEdit(textarea, edit);
	}, []);

	return { run, onKeyDown, onPaste };
}

function hasModifier(event: KeyboardEvent) {
	return event.metaKey || event.ctrlKey || event.altKey;
}

/**
 * Grow the textarea with its text. Runs after every render rather than on a
 * value change: a form `reset()` writes the value straight into the node.
 * Off, the textarea keeps the height its layout gives it.
 */
export function useAutosize(
	ref: RefObject<HTMLTextAreaElement>,
	enabled = true
) {
	const resize = useCallback(() => {
		const textarea = ref.current;

		// Hidden on Preview, where it measures 0; it is sized again on Write.
		if (!enabled || !textarea || textarea.hidden) return;

		textarea.style.height = 'auto';
		textarea.style.height = `${textarea.scrollHeight}px`;
	}, [ref, enabled]);

	useLayoutEffect(resize);

	return resize;
}
