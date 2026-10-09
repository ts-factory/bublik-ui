/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

/** The slice of an mdast node the plugin reads. */
interface MdastNode {
	type: string;
	value?: string;
	children?: MdastNode[];
	position?: { start: { line: number }; end: { line: number } };
}

const lineBreak = (): MdastNode => ({ type: 'break' });

/** A paragraph holding one line break: an empty line's worth of height. */
const blankLine = (): MdastNode => ({
	type: 'paragraph',
	children: [lineBreak()]
});

/**
 * Newlines in text become line breaks, as in a GitHub comment, instead of
 * folding into spaces. Code is a different node type, so it is left alone.
 */
function splitNewlines(node: MdastNode) {
	if (!node.children) return;

	node.children = node.children.flatMap((child) => {
		if (child.type !== 'text' || !child.value?.includes('\n')) {
			splitNewlines(child);
			return [child];
		}

		return child.value
			.split('\n')
			.flatMap((part, index) => [
				...(index > 0 ? [lineBreak()] : []),
				...(part ? [{ type: 'text', value: part }] : [])
			]);
	});
}

/**
 * Markdown reads any run of blank lines between blocks as one separator. Each
 * blank line past the first comes back as an empty line, so the text keeps
 * the spacing it was typed with.
 */
function keepBlankLines(root: MdastNode) {
	const children = root.children ?? [];

	root.children = children.flatMap((child, index) => {
		const previous = children[index - 1];

		if (!previous?.position || !child.position) return [child];

		const blank = child.position.start.line - previous.position.end.line - 1;
		const extra = Array.from({ length: Math.max(blank - 1, 0) }, blankLine);

		return [...extra, child];
	});
}

/** Remark plugin: line breaks and blank lines render as they were typed. */
export function remarkLineBreaks() {
	return (tree: MdastNode) => {
		splitNewlines(tree);
		keepBlankLines(tree);
	};
}
