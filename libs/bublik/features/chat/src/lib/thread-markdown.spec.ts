/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it } from 'vitest';
import type { UIMessage } from '@tanstack/ai-react';

import { messageText, threadToMarkdown } from './thread-markdown';

function message(role: 'user' | 'assistant', parts: unknown[]): UIMessage {
	return { id: `${role}-1`, role, createdAt: new Date(), parts } as UIMessage;
}

describe('threadToMarkdown', () => {
	it('serializes user and assistant turns with headings', () => {
		const markdown = threadToMarkdown([
			message('user', [{ type: 'text', content: 'List runs' }]),
			message('assistant', [{ type: 'text', content: 'Here are the runs.' }])
		]);
		expect(markdown).toBe(
			'## User\n\nList runs\n\n## Assistant\n\nHere are the runs.'
		);
	});

	it('renders reasoning as a blockquote and tools as fenced blocks', () => {
		const markdown = threadToMarkdown([
			message('assistant', [
				{ type: 'thinking', content: 'pondering\nlots' },
				{
					type: 'tool-call',
					id: 'c1',
					name: 'list_runs',
					arguments: '{"day":"today"}',
					state: 'complete',
					output: { count: 2 }
				}
			])
		]);
		expect(markdown).toContain('> **Reasoning**\n>\n> pondering\n> lots');
		expect(markdown).toContain('**Tool: `list_runs`**');
		expect(markdown).toContain('"day": "today"');
		expect(markdown).toContain('"count": 2');
	});

	it('skips empty parts and returns an empty string for empty threads', () => {
		expect(threadToMarkdown([])).toBe('');
		expect(
			threadToMarkdown([message('assistant', [{ type: 'text', content: ' ' }])])
		).toBe('');
	});
});

describe('messageText', () => {
	it('joins text parts and excludes reasoning and tool calls', () => {
		const text = messageText(
			message('assistant', [
				{ type: 'thinking', content: 'secret reasoning' },
				{ type: 'text', content: 'First paragraph.' },
				{
					type: 'tool-call',
					id: 'c1',
					name: 'list_runs',
					arguments: '{"day":"today"}',
					state: 'complete',
					output: { count: 2 }
				},
				{ type: 'text', content: 'Second paragraph.' }
			])
		);
		expect(text).toBe('First paragraph.\n\nSecond paragraph.');
		expect(text).not.toContain('secret reasoning');
		expect(text).not.toContain('list_runs');
	});

	it('returns an empty string when there are no text parts', () => {
		expect(
			messageText(
				message('assistant', [{ type: 'thinking', content: 'only reasoning' }])
			)
		).toBe('');
	});
});
