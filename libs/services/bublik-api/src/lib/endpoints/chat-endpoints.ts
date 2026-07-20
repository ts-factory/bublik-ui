/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2025-2026 OKTET LTD */
import { EndpointBuilder } from '@reduxjs/toolkit/query';
import { z } from 'zod';

import { BublikBaseQueryFn, withApiV2 } from '../config';
import { BUBLIK_TAG } from '../types';
import { API_REDUCER_PATH } from '../constants';

// Reasoning effort levels come from pydantic-ai's unified thinking vocabulary
// (minimal/low/medium/high/xhigh), derived server-side from the model's
// `reasoning` flag rather than configured, so they stay free-form strings here.
export const ReasoningEffortSchema = z.string();

export type ReasoningEffort = z.infer<typeof ReasoningEffortSchema>;

// Field names mirror models.dev: `id` is the model id sent to the provider,
// `name` is the human-readable display label.
export const ChatModelSchema = z.object({
	id: z.string(),
	name: z.string(),
	limit: z
		.object({
			context: z.number().optional(),
			output: z.number().optional()
		})
		.nullish(),
	modalities: z
		.object({
			input: z.array(z.string()),
			output: z.array(z.string())
		})
		.nullish(),
	tool_call: z.boolean().nullish(),
	reasoning: z.boolean().nullish(),
	supports_reasoning_effort: z.boolean(),
	reasoning_efforts: z.array(z.string()),
	default_reasoning_effort: z.string().nullable()
});

export type ChatModel = z.infer<typeof ChatModelSchema>;

export const ChatProviderSchema = z.object({
	id: z.string(),
	type: z.string(),
	name: z.string(),
	models: z.array(ChatModelSchema)
});

export type ChatProvider = z.infer<typeof ChatProviderSchema>;

export const ChatModelsResponseSchema = z.object({
	providers: z.array(ChatProviderSchema),
	default_model: z
		.object({ provider: z.string(), model: z.string() })
		.nullable()
});

export type ChatModelsResponse = z.infer<typeof ChatModelsResponseSchema>;

export const ChatThreadListItemSchema = z.object({
	id: z.string(),
	title: z.string(),
	is_archived: z.boolean(),
	// Whether a run is streaming for this thread in the background right now.
	is_streaming: z.boolean(),
	created: z.string(),
	updated: z.string()
});

export type ChatThreadListItem = z.infer<typeof ChatThreadListItemSchema>;

export const ChatThreadListResponseSchema = z.array(ChatThreadListItemSchema);

// Last known context occupancy of a thread, maintained server-side from real
// model usage (see bublik/ai/compaction.py). Seeds the composer's context
// meter on thread load; live updates arrive as AG-UI CUSTOM events.
export const ChatContextUsageSchema = z.object({
	tokens: z.number(),
	context_limit: z.number().nullish(),
	provider: z.string().nullish(),
	model: z.string().nullish(),
	// Whether older turns are summarized for the model (the stored
	// conversation itself is never trimmed).
	compacted: z.boolean().nullish(),
	covered_count: z.number().nullish(),
	compacted_at: z.string().nullish()
});

export type ChatContextUsage = z.infer<typeof ChatContextUsageSchema>;

export const ChatThreadDetailSchema = z.object({
	id: z.string(),
	title: z.string(),
	is_archived: z.boolean(),
	// Stored UIMessage[] (the exact shape `useChat` persists); kept opaque here.
	messages: z.array(z.any()),
	// Id of the run streaming for this thread right now, or null when idle.
	active_run_id: z.string().nullable(),
	context_usage: ChatContextUsageSchema.nullish(),
	created: z.string(),
	updated: z.string()
});

export type ChatThreadDetail = z.infer<typeof ChatThreadDetailSchema>;

export const chatEndpoints = {
	endpoints: (
		build: EndpointBuilder<BublikBaseQueryFn, BUBLIK_TAG, API_REDUCER_PATH>
	) => ({
		getChatModels: build.query<ChatModelsResponse, void>({
			query: () => ({
				url: withApiV2('/chat/models', true),
				cache: 'no-cache'
			}),
			responseSchema: ChatModelsResponseSchema,
			providesTags: [BUBLIK_TAG.Chat]
		}),
		getChatThreads: build.query<
			ChatThreadListItem[],
			{ archived?: boolean } | void
		>({
			query: (arg) => ({
				url: withApiV2(
					`/chat/threads/${arg && arg.archived ? '?archived=true' : ''}`,
					true
				),
				cache: 'no-cache'
			}),
			responseSchema: ChatThreadListResponseSchema,
			providesTags: [BUBLIK_TAG.Chat]
		}),
		// Full thread (including messages) used to seed `useChat`'s initial
		// messages on entry. Intentionally NOT tagged with BUBLIK_TAG.Chat so the
		// onFinish invalidation that refreshes the sidebar doesn't refetch/remount
		// the active conversation.
		getChatThread: build.query<ChatThreadDetail, string>({
			query: (id) => ({
				url: withApiV2(`/chat/threads/${id}/`, true),
				cache: 'no-cache'
			}),
			responseSchema: ChatThreadDetailSchema,
			// Always refetch on mount so reopened threads get fresh context
			// usage / compaction state instead of a stale cached response.
			refetchOnMountOrArgChange: true
		}),
		renameChatThread: build.mutation<
			ChatThreadListItem,
			{ id: string; title: string }
		>({
			query: ({ id, title }) => ({
				url: withApiV2(`/chat/threads/${id}`),
				method: 'PATCH',
				body: { title }
			}),
			invalidatesTags: [BUBLIK_TAG.Chat]
		}),
		setChatThreadArchived: build.mutation<
			ChatThreadListItem,
			{ id: string; is_archived: boolean }
		>({
			query: ({ id, is_archived }) => ({
				url: withApiV2(`/chat/threads/${id}`),
				method: 'PATCH',
				body: { is_archived }
			}),
			invalidatesTags: [BUBLIK_TAG.Chat]
		}),
		deleteChatThread: build.mutation<void, string>({
			query: (id) => ({
				url: withApiV2(`/chat/threads/${id}`),
				method: 'DELETE'
			}),
			invalidatesTags: [BUBLIK_TAG.Chat]
		}),
		// Interrupt a thread's in-flight background run. `stop()` on the client
		// only aborts the local SSE subscription; this tells the server to tear
		// the run down so it stops streaming and the sidebar indicator clears.
		// Idempotent server-side: a thread with no running run still succeeds.
		cancelChatRun: build.mutation<void, { threadId: string }>({
			query: ({ threadId }) => ({
				url: withApiV2(`/chat/cancel?thread=${encodeURIComponent(threadId)}`, true),
				method: 'POST'
			}),
			invalidatesTags: [BUBLIK_TAG.Chat]
		})
	})
};
