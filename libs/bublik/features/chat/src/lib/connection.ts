/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2025-2026 OKTET LTD */
import { fetchServerSentEvents } from '@tanstack/ai-react';

import { sanitizeSnapshotChunk } from './sanitize';

/**
 * Resumable connection adapter for TanStack AI's `useChat`.
 *
 * Unlike the default `fetchServerSentEvents` (a single POST that streams the
 * response), this uses TanStack's decoupled `subscribe`/`send` model so a chat
 * run survives the client navigating away or reloading:
 *
 * - `send`      POSTs the AG-UI run input to start the run. The server runs the
 *               agent in a background task and buffers its events in Redis, then
 *               returns an empty `202`. We reuse `fetchServerSentEvents` purely to
 *               build that request body and drive the POST; no events come back on
 *               this channel.
 * - `subscribe` opens a long-lived GET SSE stream that replays the thread's
 *               in-progress run from the start and tails it live. The client opens
 *               it on mount (before the first `send`), so switching threads or
 *               reloading re-subscribes and resumes.
 *
 * See `bublik/bublik/ai/app.py` for the matching server endpoints.
 */

// Derive the exact `connect` arg + chunk types from the library so `send` stays
// signature-compatible with what `useChat` expects, without importing internals.
type Connect = ReturnType<typeof fetchServerSentEvents>['connect'];
type SendArgs = Parameters<Connect>;
type StreamChunk = Connect extends (...args: never[]) => AsyncIterable<infer C>
	? C
	: never;

export interface ResumableConnectionUrls {
	/** POST endpoint that starts a run (carries provider/model/effort query). */
	sendUrl: () => string;
	/** GET SSE endpoint that streams a thread's run (carries the thread id). */
	subscribeUrl: () => string;
}

/** Parse an SSE response body into JSON `data:` chunks, ignoring comments. */
async function* parseSse(
	response: Response,
	signal?: AbortSignal
): AsyncGenerator<StreamChunk> {
	if (!response.ok) {
		throw new Error(
			`HTTP error! status: ${response.status} ${response.statusText}`
		);
	}
	const reader = response.body?.getReader();
	if (!reader) return;
	const decoder = new TextDecoder();
	let buffer = '';
	try {
		while (!signal?.aborted) {
			const { done, value } = await reader.read();
			if (done) break;
			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() ?? '';
			for (const raw of lines) {
				const line = raw.trim();
				// Skip blank lines, comments/keep-alives (`:`), and SSE metadata lines.
				if (!line || !line.startsWith('data:')) continue;
				const data = line.slice('data:'.length).trim();
				if (!data || data === '[DONE]') continue;
				const parsed = JSON.parse(data) as unknown;
				// The server's MESSAGES_SNAPSHOT echoes the run input, which carries
				// TanStack's redundant tool/reasoning fan-out entries; strip them so
				// they never materialize as duplicate messages (see sanitize.ts).
				yield sanitizeSnapshotChunk(parsed as StreamChunk);
			}
		}
	} finally {
		reader.releaseLock();
	}
}

export function createResumableConnection({
	sendUrl,
	subscribeUrl,
}: ResumableConnectionUrls) {
	// `fetchServerSentEvents` builds the AG-UI RunAgentInput body and POSTs it; we
	// reuse only that. The server's empty 202 yields no chunks, so the loop just
	// drives the request to completion. The `Accept` header makes the server
	// encode the buffered run events as SSE (the format `subscribe` replays).
	const sender = fetchServerSentEvents(sendUrl, () => ({
		credentials: 'include',
		headers: { Accept: 'text/event-stream' }
	}));

	return {
		async send(...args: SendArgs): Promise<void> {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			for await (const _chunk of sender.connect(...args)) {
				// Events arrive on the subscribe channel, not here.
			}
		},
		subscribe(abortSignal?: AbortSignal): AsyncIterable<StreamChunk> {
			return (async function* () {
				const response = await fetch(subscribeUrl(), {
					credentials: 'include',
					headers: { Accept: 'text/event-stream' },
					...(abortSignal ? { signal: abortSignal } : {})
				});
				yield* parseSse(response, abortSignal);
			})();
		}
	};
}
