/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2025-2026 OKTET LTD */
import { describe, expect, it } from 'vitest';
import type { UIMessage } from '@tanstack/ai-react';

import { regroupTrailingReasoning } from './regroup-reasoning';

type Part = UIMessage['parts'][number];

function text(content: string): Part {
	return { type: 'text', content } as unknown as Part;
}

function thinking(content: string): Part {
	return { type: 'thinking', content } as unknown as Part;
}

function toolCall(id: string): Part {
	return {
		type: 'tool-call',
		id,
		name: 'list_runs',
		arguments: '{}',
		state: 'complete'
	} as unknown as Part;
}

function assistant(id: string, parts: Part[]): UIMessage {
	return { id, role: 'assistant', parts } as unknown as UIMessage;
}

function user(id: string, parts: Part[]): UIMessage {
	return { id, role: 'user', parts } as unknown as UIMessage;
}

function types(message: UIMessage): string[] {
	return message.parts.map((part) => part.type);
}

describe('regroupTrailingReasoning', () => {
	it('moves a middle message trailing reasoning to the next message head', () => {
		const messages = [
			assistant('a', [text('Found it'), toolCall('c1'), thinking('next step')]),
			assistant('b', [text('Grab runs'), toolCall('c2')])
		];

		const out = regroupTrailingReasoning(messages);

		expect(types(out[0])).toEqual(['text', 'tool-call']);
		expect(types(out[1])).toEqual(['thinking', 'text', 'tool-call']);
		// The moved reasoning keeps its content and ids stay stable.
		expect(out[1].id).toBe('b');
		expect((out[1].parts[0] as { content: string }).content).toBe('next step');
	});

	it('leaves the last message trailing reasoning in place (streaming)', () => {
		const messages = [
			assistant('a', [text('Grab runs'), toolCall('c1'), thinking('live')])
		];

		const out = regroupTrailingReasoning(messages);

		expect(out).toHaveLength(1);
		expect(types(out[0])).toEqual(['text', 'tool-call', 'thinking']);
	});

	it('returns messages without trailing reasoning unchanged by reference', () => {
		const messages = [
			assistant('a', [text('one'), toolCall('c1')]),
			assistant('b', [text('two')])
		];

		const out = regroupTrailingReasoning(messages);

		expect(out[0]).toBe(messages[0]);
		expect(out[1]).toBe(messages[1]);
	});

	it('does not move interior (non-trailing) reasoning', () => {
		const messages = [
			assistant('a', [thinking('lead'), text('answer'), toolCall('c1')]),
			assistant('b', [text('next')])
		];

		const out = regroupTrailingReasoning(messages);

		expect(out[0]).toBe(messages[0]);
		expect(types(out[1])).toEqual(['text']);
	});

	it('drains and drops a reasoning-only message', () => {
		const messages = [
			assistant('a', [thinking('only reasoning')]),
			assistant('b', [text('answer')])
		];

		const out = regroupTrailingReasoning(messages);

		expect(out).toHaveLength(1);
		expect(out[0].id).toBe('b');
		expect(types(out[0])).toEqual(['thinking', 'text']);
	});

	it('does not move reasoning across a user message', () => {
		const messages = [
			assistant('a', [text('done'), thinking('trailing')]),
			user('u', [text('next question')])
		];

		const out = regroupTrailingReasoning(messages);

		expect(out[0]).toBe(messages[0]);
		expect(types(out[0])).toEqual(['text', 'thinking']);
		expect(out[1]).toBe(messages[1]);
	});
});
