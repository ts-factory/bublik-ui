/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it } from 'vitest';
import type { UIMessage } from '@tanstack/ai-react';

import {
	getToolOutput,
	getToolStatus,
	isPartStreaming,
	type ToolCallPart
} from './part-state';

function toolCall(overrides: Partial<ToolCallPart> = {}): ToolCallPart {
	return {
		type: 'tool-call',
		id: 'call-1',
		name: 'get_run_overview',
		arguments: '{"run_id":1}',
		state: 'input-streaming',
		...overrides
	};
}

describe('getToolStatus', () => {
	it('maps in-progress states to running', () => {
		expect(getToolStatus(toolCall({ state: 'awaiting-input' }))).toBe(
			'running'
		);
		expect(getToolStatus(toolCall({ state: 'input-streaming' }))).toBe(
			'running'
		);
		expect(getToolStatus(toolCall({ state: 'input-complete' }))).toBe(
			'running'
		);
	});

	it('maps complete state or present output to complete', () => {
		expect(getToolStatus(toolCall({ state: 'complete' }))).toBe('complete');
		expect(
			getToolStatus(toolCall({ state: 'input-complete', output: { ok: true } }))
		).toBe('complete');
	});

	it('maps error state to error', () => {
		expect(getToolStatus(toolCall({ state: 'error' }))).toBe('error');
	});

	it('detects complete from sibling tool-result part', () => {
		const part = toolCall({ state: 'input-complete' });
		const message = {
			parts: [
				part,
				{
					type: 'tool-result',
					toolCallId: 'call-1',
					content: 'stored result',
					state: 'complete'
				}
			]
		} as unknown as UIMessage;
		expect(getToolStatus(part, message)).toBe('complete');
	});

	it('detects error from sibling tool-result part', () => {
		const part = toolCall({ state: 'input-complete' });
		const message = {
			parts: [
				part,
				{
					type: 'tool-result',
					toolCallId: 'call-1',
					error: 'something went wrong',
					state: 'complete'
				}
			]
		} as unknown as UIMessage;
		expect(getToolStatus(part, message)).toBe('error');
	});
});

describe('isPartStreaming', () => {
	it('is true only for the last part of a streaming message', () => {
		expect(isPartStreaming(true, 2, 3)).toBe(true);
		expect(isPartStreaming(true, 1, 3)).toBe(false);
		expect(isPartStreaming(false, 2, 3)).toBe(false);
	});
});

describe('getToolOutput', () => {
	it('prefers the output on the part itself', () => {
		const part = toolCall({ state: 'complete', output: 'result' });
		const message = { parts: [part] } as unknown as UIMessage;
		expect(getToolOutput(part, message)).toEqual({
			output: 'result',
			errorText: undefined
		});
	});

	it('falls back to the sibling tool-result part', () => {
		const part = toolCall({ state: 'input-complete' });
		const message = {
			parts: [
				part,
				{
					type: 'tool-result',
					toolCallId: 'call-1',
					content: 'stored result',
					state: 'complete'
				}
			]
		} as unknown as UIMessage;
		expect(getToolOutput(part, message)).toEqual({
			output: 'stored result',
			errorText: undefined
		});
	});

	it('reports an error for failed calls', () => {
		const part = toolCall({ state: 'error' });
		const message = { parts: [part] } as unknown as UIMessage;
		expect(getToolOutput(part, message).errorText).toBe('Tool call failed');
	});
});
