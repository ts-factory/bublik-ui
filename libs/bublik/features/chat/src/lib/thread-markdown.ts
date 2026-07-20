/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import type { UIMessage } from '@tanstack/ai-react';

function prettyJson(value: string): string {
	try {
		return JSON.stringify(JSON.parse(value), null, 2);
	} catch {
		return value;
	}
}

function quote(text: string): string {
	return text
		.trim()
		.split('\n')
		.map((line) => `> ${line}`)
		.join('\n');
}

/**
 * Serialize a thread to Markdown for the copy/download actions. Assistant
 * reasoning is emitted as a blockquote and tool calls as fenced JSON blocks;
 * tool results and structured output ride along with their call.
 */
export function threadToMarkdown(messages: UIMessage[]): string {
	const sections: string[] = [];

	for (const message of messages) {
		const heading = message.role === 'user' ? '## User' : '## Assistant';
		const parts: string[] = [];

		for (const part of message.parts) {
			switch (part.type) {
				case 'text':
					if (part.content.trim()) parts.push(part.content.trim());
					break;
				case 'thinking':
					if (part.content.trim()) {
						parts.push(`> **Reasoning**\n>\n${quote(part.content)}`);
					}
					break;
				case 'tool-call': {
					const block = [`**Tool: \`${part.name}\`**`];
					if (part.arguments) {
						block.push(`\`\`\`json\n${prettyJson(part.arguments)}\n\`\`\``);
					}
					if (part.output !== undefined) {
						const output =
							typeof part.output === 'string'
								? part.output
								: JSON.stringify(part.output, null, 2);
						block.push(`\`\`\`json\n${output}\n\`\`\``);
					}
					parts.push(block.join('\n\n'));
					break;
				}
				default:
					break;
			}
		}

		if (parts.length > 0) sections.push(`${heading}\n\n${parts.join('\n\n')}`);
	}

	return sections.join('\n\n');
}

/**
 * The copyable text of a single message: its `text` parts only. Reasoning
 * (`thinking`) and tool calls are deliberately excluded — the per-message copy
 * action must carry just the visible response.
 */
export function messageText(message: UIMessage): string {
	return message.parts
		.flatMap((part) => (part.type === 'text' ? [part.content] : []))
		.join('\n\n')
		.trim();
}

/** Trigger a client-side download of the given Markdown text. */
export function downloadMarkdown(filename: string, markdown: string): void {
	const blob = new Blob([markdown], { type: 'text/markdown' });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = filename;
	anchor.click();
	URL.revokeObjectURL(url);
}
