/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import type { UIMessage } from '@tanstack/ai-react';

export type ToolCallPart = Extract<
	UIMessage['parts'][number],
	{ type: 'tool-call' }
>;
export type ToolResultPart = Extract<
	UIMessage['parts'][number],
	{ type: 'tool-result' }
>;

export type ToolStatus = 'running' | 'complete' | 'error';

/**
 * Collapse the TanStack AI tool-call lifecycle
 * (awaiting-input | input-streaming | input-complete | approval-* | complete | error)
 * into the three visual states the Tool card renders. Works for persisted
 * history too: a stored call either reached `complete`/`error` or carries an
 * `output`.
 */
export function getToolStatus(part: ToolCallPart): ToolStatus {
	if (part.state === 'error') return 'error';
	if (part.state === 'complete' || part.output !== undefined) return 'complete';
	return 'running';
}

/**
 * A thinking part has no lifecycle field, so "still streaming" is positional:
 * new parts are only appended after the thinking block closes, so the block is
 * live iff its message is streaming (run loading + last message) and it is the
 * last part of that message.
 */
export function isPartStreaming(
	messageIsStreaming: boolean,
	partIndex: number,
	partCount: number
): boolean {
	return messageIsStreaming && partIndex === partCount - 1;
}

/**
 * A tool-call's output normally arrives on the part itself, but older runs
 * stored it as a sibling `tool-result` part; fall back to that.
 */
export function getToolOutput(
	part: ToolCallPart,
	message: UIMessage
): { output: unknown; errorText: string | undefined } {
	if (part.state === 'error' || part.output !== undefined) {
		return {
			output: part.output,
			errorText: part.state === 'error' ? 'Tool call failed' : undefined
		};
	}
	const result = message.parts.find(
		(p): p is ToolResultPart =>
			p.type === 'tool-result' && p.toolCallId === part.id
	);
	return { output: result?.content, errorText: result?.error };
}
