/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2025-2026 OKTET LTD */
import type { UIMessage } from '@tanstack/ai-react';

import { config } from '@/bublik/config';

import { sanitizeWireMessages } from './sanitize';

/**
 * Server-backed persistence adapter for TanStack AI's `useChat`.
 *
 * Conversations are stored per-thread in Postgres via the Django
 * `/api/v2/chat/threads/{id}/` endpoints. The adapter is best-effort: storage
 * failures are swallowed so they never break the chat (matching the adapter
 * contract). The `id` argument is the `useChat` `id` (the thread id).
 */

function threadUrl(id: string): string {
	return `${config.rootUrl}/api/v2/chat/threads/${id}/`;
}

/**
 * `UIMessage.createdAt` is a `Date` that `JSON.stringify` turned into a string
 * on the way to the server; revive it on read.
 */
export function reviveCreatedAt(message: UIMessage): UIMessage {
	if (typeof message.createdAt === 'string') {
		return { ...message, createdAt: new Date(message.createdAt) };
	}
	return message;
}

export const serverPersistence = {
	getItem: async (id: string): Promise<UIMessage[] | null> => {
		try {
			const res = await fetch(threadUrl(id), { credentials: 'include' });
			if (!res.ok) return null;
			const data = (await res.json()) as { messages?: UIMessage[] };
			return (data.messages ?? []).map(reviveCreatedAt);
		} catch {
			return null;
		}
	},
	setItem: async (id: string, messages: UIMessage[]): Promise<void> => {
		try {
			// Never persist fan-out artifacts or same-id duplicates (resume/replay
			// leftovers; see sanitize.ts).
			await fetch(threadUrl(id), {
				method: 'PUT',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ messages: sanitizeWireMessages(messages) })
			});
		} catch {
			// best-effort: ignore storage failures
		}
	},
	removeItem: async (id: string): Promise<void> => {
		try {
			await fetch(threadUrl(id), { method: 'DELETE', credentials: 'include' });
		} catch {
			// best-effort: ignore storage failures
		}
	}
};
