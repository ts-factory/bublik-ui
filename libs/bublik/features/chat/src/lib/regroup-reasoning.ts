/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2025-2026 OKTET LTD */

/**
 * Regroup trailing reasoning across the assistant messages of a turn.
 *
 * The server/SDK splits one assistant turn into several consecutive
 * `UIMessage`s. Such a message often ends with a `thinking` (reasoning) part
 * that is really the model deciding what to do *next* -- its content leads
 * straight into the following message's text/tool calls. Left in place, that
 * trailing reasoning renders *below* the current message's copy/actions bar
 * (which follows all parts), so the copy button looks like it sits under
 * reasoning that belongs to the next message.
 *
 * `regroupTrailingReasoning` moves each assistant message's contiguous trailing
 * run of `thinking` parts to the head of the following assistant message, so
 * every step reads "reasoning -> response -> tools" and the copy button lands
 * right after the tool calls.
 *
 * Display-only: it never touches the last message (which owns the live
 * streaming reasoning block -- see `isPartStreaming`), only moves across an
 * assistant successor, and drops a source message that a full drain leaves
 * empty. Message ids are preserved so React keys stay stable, and unchanged
 * messages are returned by reference.
 */
import type { UIMessage } from '@tanstack/ai-react';

type Parts = UIMessage['parts'];

/** Length of the contiguous run of `thinking` parts at the tail of `parts`. */
function trailingThinkingCount(parts: Parts): number {
	let count = 0;
	for (let i = parts.length - 1; i >= 0; i--) {
		if (parts[i].type !== 'thinking') break;
		count++;
	}
	return count;
}

export function regroupTrailingReasoning(messages: UIMessage[]): UIMessage[] {
	const out: UIMessage[] = [];
	// Parts carried over from the previous message, to prepend to the current one.
	let carried: Parts = [];

	messages.forEach((message, idx) => {
		const isLast = idx === messages.length - 1;
		const next = messages[idx + 1];
		// Only drain trailing reasoning into an assistant successor; the last
		// message keeps its (possibly live) trailing reasoning in place.
		const canDrain =
			!isLast && message.role === 'assistant' && next?.role === 'assistant';
		const drain = canDrain ? trailingThinkingCount(message.parts) : 0;

		const hasCarry = carried.length > 0;
		if (!hasCarry && drain === 0) {
			out.push(message);
			carried = [];
			return;
		}

		const split = message.parts.length - drain;
		const kept = drain > 0 ? message.parts.slice(0, split) : message.parts;
		const parts = hasCarry ? [...carried, ...kept] : kept;
		carried = drain > 0 ? message.parts.slice(split) : [];

		// A reasoning-only message that was fully drained (and received nothing)
		// leaves no content -- drop it rather than render an empty block.
		if (parts.length === 0) return;

		out.push({ ...message, parts });
	});

	return out;
}
