/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2025-2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import {
	dedupeMessagesById,
	sanitizeSnapshotChunk,
	sanitizeWireMessages,
	type WireEntry
} from './sanitize';

/** Assistant anchor with a completed tool call (call + result parts). */
function toolAnchor(id = 'msg-1', toolCallId = 'call-1'): WireEntry {
	return {
		id,
		role: 'assistant',
		parts: [
			{ type: 'tool-call', id: toolCallId },
			{ type: 'tool-result', toolCallId },
			{ type: 'text' }
		]
	};
}

/** Assistant anchor with a thinking part. */
function thinkingAnchor(id = 'msg-2'): WireEntry {
	return {
		id,
		role: 'assistant',
		parts: [{ type: 'thinking' }, { type: 'text' }]
	};
}

/** Bare `{role:'tool'}` wire fan-out (no parts). */
function toolFanout(toolCallId = 'call-1'): WireEntry {
	return { id: `tool-${toolCallId}`, role: 'tool', toolCallId };
}

/** Bare `{role:'reasoning'}` wire fan-out (no parts). */
function reasoningFanout(anchorId = 'msg-2', suffix = 'ab12'): WireEntry {
	return { id: `${anchorId}-reasoning-${suffix}`, role: 'reasoning' };
}

describe('sanitizeWireMessages', () => {
	it('drops tool and reasoning fan-outs covered by their anchors', () => {
		const result = sanitizeWireMessages([
			{ id: 'user-1', role: 'user', parts: [{ type: 'text' }] },
			thinkingAnchor('msg-2'),
			reasoningFanout('msg-2'),
			toolAnchor('msg-1'),
			toolFanout('call-1')
		]);
		expect(result.map((m) => m.id)).toEqual(['user-1', 'msg-2', 'msg-1']);
	});

	it('drops materialized fan-out messages when the anchor still has the data', () => {
		// A previous snapshot minted these as standalone messages and they were
		// persisted; on the next send they collide with the fresh fan-outs.
		const materializedTool: WireEntry = {
			id: 'tool-call-1',
			role: 'assistant',
			parts: [{ type: 'tool-result', toolCallId: 'call-1' }]
		};
		const materializedReasoning: WireEntry = {
			id: 'msg-2-reasoning-ab12',
			role: 'assistant',
			parts: [{ type: 'thinking' }]
		};
		const result = sanitizeWireMessages([
			toolAnchor('msg-1'),
			materializedTool,
			thinkingAnchor('msg-2'),
			materializedReasoning
		]);
		expect(result.map((m) => m.id)).toEqual(['msg-1', 'msg-2']);
	});

	it('collapses a materialized fan-out colliding with a fresh one (the duplicate-key case)', () => {
		const materializedTool: WireEntry = {
			id: 'tool-call-1',
			role: 'assistant',
			parts: [{ type: 'tool-result', toolCallId: 'call-1' }]
		};
		const result = sanitizeWireMessages([
			toolAnchor('msg-1'),
			materializedTool,
			toolFanout('call-1')
		]);
		expect(result.map((m) => m.id)).toEqual(['msg-1']);
		const ids = result.map((m) => m.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('keeps an uncovered fan-out rather than losing data', () => {
		// No anchor carries call-9 or has a thinking part.
		const result = sanitizeWireMessages([
			{ id: 'user-1', role: 'user', parts: [{ type: 'text' }] },
			toolFanout('call-9'),
			reasoningFanout('msg-9')
		]);
		expect(result.map((m) => m.id)).toEqual([
			'user-1',
			'tool-call-9',
			'msg-9-reasoning-ab12'
		]);
	});

	it('keeps a materialized fan-out when its anchor is gone, without duplicate ids', () => {
		const materializedTool: WireEntry = {
			id: 'tool-call-1',
			role: 'assistant',
			parts: [{ type: 'tool-result', toolCallId: 'call-1' }]
		};
		// The materialized copy is the only owner of call-1: it must survive, and
		// the fresh fan-out collapses into it by id.
		const result = sanitizeWireMessages([
			materializedTool,
			toolFanout('call-1')
		]);
		expect(result.map((m) => m.id)).toEqual(['tool-call-1']);
	});

	it('does not touch ordinary conversations', () => {
		const messages: WireEntry[] = [
			{ id: 'user-1', role: 'user', parts: [{ type: 'text' }] },
			{ id: 'msg-1', role: 'assistant', parts: [{ type: 'text' }] }
		];
		expect(sanitizeWireMessages(messages)).toEqual(messages);
	});
});

describe('dedupeMessagesById', () => {
	it('keeps the last copy of a duplicated id at its first position', () => {
		const result = dedupeMessagesById([
			{ id: 'a', v: 1 },
			{ id: 'b', v: 2 },
			{ id: 'a', v: 3 }
		]);
		expect(result).toEqual([
			{ id: 'a', v: 3 },
			{ id: 'b', v: 2 }
		]);
	});
});

describe('sanitizeSnapshotChunk', () => {
	it('sanitizes MESSAGES_SNAPSHOT payloads', () => {
		const chunk = {
			type: 'MESSAGES_SNAPSHOT',
			messages: [toolAnchor('msg-1'), toolFanout('call-1')]
		};
		const result = sanitizeSnapshotChunk(chunk);
		expect(result.messages.map((m) => m.id)).toEqual(['msg-1']);
	});

	it('passes other chunks through untouched', () => {
		const chunk = { type: 'TEXT_MESSAGE_CONTENT', delta: 'hi' };
		expect(sanitizeSnapshotChunk(chunk)).toBe(chunk);
	});
});
