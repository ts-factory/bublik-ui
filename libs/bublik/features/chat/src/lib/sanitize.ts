/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2025-2026 OKTET LTD */

/**
 * Sanitizers for AG-UI wire message arrays (MESSAGES_SNAPSHOT payloads and
 * persisted thread histories).
 *
 * TanStack AI's `uiMessagesToWire` serializes every assistant message as an
 * "anchor" (carrying the canonical `parts` array) PLUS redundant fan-out
 * entries for strict AG-UI servers: each `tool-result` part is also emitted as
 * `{role:'tool', id:'tool-<toolCallId>'}` and each `thinking` part as
 * `{role:'reasoning', id:'<messageId>-reasoning-<suffix>'}`. Our server echoes
 * the run input back as a MESSAGES_SNAPSHOT (see `bublik/bublik/ai/app.py`),
 * and TanStack's snapshot mapper does NOT fold fan-outs back into their
 * anchors -- each becomes a standalone message that gets persisted and then
 * fanned out again on the next send. The anchor's fresh fan-out and the
 * materialized copy share the same deterministic id, which is what React's
 * "two children with the same key" warnings in the conversation list were.
 *
 * `sanitizeWireMessages` drops fan-out entries (and previously materialized
 * fan-out messages already saved in Postgres) whenever an anchor still carries
 * the same data, then collapses any residual same-id duplicates.
 */

/** The subset of a message part the sanitizer inspects. */
interface WirePart {
	type: string;
	/** `tool-call` parts: the tool call id. */
	id?: string;
	/** `tool-result` parts: the tool call they answer. */
	toolCallId?: string;
}

/**
 * One entry of a wire message array. Anchors (and persisted `UIMessage`s)
 * carry `parts`; `{role:'tool'|'reasoning'}` fan-outs do not.
 */
export interface WireEntry {
	id?: string;
	role?: string;
	parts?: ReadonlyArray<WirePart>;
	/** `{role:'tool'}` fan-outs: the tool call they answer. */
	toolCallId?: string;
}

const TOOL_ID_PREFIX = 'tool-';
const REASONING_INFIX = '-reasoning-';

/**
 * Collapse messages that share an `id` down to a single entry.
 *
 * Resume/replay can leave the conversation with the same message persisted more
 * than once (observed in storage as the same assistant id appearing twice),
 * which also breaks React's `key={message.id}`. Keep each id's *last* copy (the
 * most complete during streaming) at the position of its first appearance so
 * conversation order is preserved.
 */
export function dedupeMessagesById<T extends { id?: string }>(
	messages: T[]
): T[] {
	const lastById = new Map<string, T>();
	for (const message of messages) {
		if (message.id) lastById.set(message.id, message);
	}
	const seen = new Set<string>();
	const out: T[] = [];
	for (const message of messages) {
		const id = message.id;
		if (!id) {
			out.push(message);
			continue;
		}
		if (seen.has(id)) continue;
		seen.add(id);
		out.push(lastById.get(id) ?? message);
	}
	return out;
}

/** Which entries carry each tool call id in their parts (call or result). */
function collectToolCallOwners(
	entries: ReadonlyArray<WireEntry>
): Map<string, Set<string>> {
	const owners = new Map<string, Set<string>>();
	for (const entry of entries) {
		if (!entry.parts || !entry.id) continue;
		for (const part of entry.parts) {
			const callId =
				part.type === 'tool-call'
					? part.id
					: part.type === 'tool-result'
					? part.toolCallId
					: undefined;
			if (callId === undefined) continue;
			const set = owners.get(callId) ?? new Set<string>();
			set.add(entry.id);
			owners.set(callId, set);
		}
	}
	return owners;
}

/** Ids of entries that carry at least one thinking part. */
function collectThinkingOwners(entries: ReadonlyArray<WireEntry>): Set<string> {
	const owners = new Set<string>();
	for (const entry of entries) {
		if (!entry.parts || !entry.id) continue;
		if (entry.parts.some((part) => part.type === 'thinking')) {
			owners.add(entry.id);
		}
	}
	return owners;
}

/** Whether some entry other than `selfId` carries the data. */
function ownedByOther(
	owners: Set<string> | undefined,
	selfId: string | undefined
): boolean {
	if (!owners) return false;
	for (const owner of owners) {
		if (owner !== selfId) return true;
	}
	return false;
}

/**
 * Whether `id` is a reasoning fan-out id derived from an entry that still has
 * its thinking part (fan-out ids are `<anchorId>-reasoning-<suffix>`).
 */
function hasReasoningAnchor(id: string, thinkingIds: Set<string>): boolean {
	for (const anchorId of thinkingIds) {
		if (id.startsWith(anchorId + REASONING_INFIX)) return true;
	}
	return false;
}

/**
 * Drop redundant fan-out entries and previously materialized fan-out messages,
 * then collapse residual same-id duplicates. Drops are guarded: an entry is
 * only removed when another entry still carries the same tool result /
 * thinking content, so an orphaned fan-out is kept rather than lost.
 */
export function sanitizeWireMessages<T extends WireEntry>(messages: T[]): T[] {
	const toolCallOwners = collectToolCallOwners(messages);
	const thinkingOwners = collectThinkingOwners(messages);

	const kept = messages.filter((entry) => {
		const id = entry.id;
		if (!entry.parts) {
			// Bare wire fan-outs (never valid standalone messages for the UI).
			if (entry.role === 'tool' && entry.toolCallId !== undefined) {
				return !ownedByOther(toolCallOwners.get(entry.toolCallId), id);
			}
			if (entry.role === 'reasoning' && id) {
				return !hasReasoningAnchor(id, thinkingOwners);
			}
			return true;
		}
		if (!id) return true;
		// Materialized fan-outs: full messages minted from a fan-out by a
		// previous snapshot and persisted; recognizable by the derived id.
		if (id.startsWith(TOOL_ID_PREFIX)) {
			const callId = id.slice(TOOL_ID_PREFIX.length);
			if (ownedByOther(toolCallOwners.get(callId), id)) return false;
		}
		return !hasReasoningAnchor(id, thinkingOwners);
	});

	return dedupeMessagesById(kept);
}

/**
 * Sanitize a parsed SSE chunk on its way into `useChat`: MESSAGES_SNAPSHOT
 * payloads get their message array cleaned, everything else passes through.
 */
export function sanitizeSnapshotChunk<T>(chunk: T): T {
	const candidate = chunk as { type?: unknown; messages?: unknown };
	if (
		candidate &&
		candidate.type === 'MESSAGES_SNAPSHOT' &&
		Array.isArray(candidate.messages)
	) {
		return {
			...(chunk as object),
			messages: sanitizeWireMessages(candidate.messages as WireEntry[])
		} as T;
	}
	return chunk;
}
