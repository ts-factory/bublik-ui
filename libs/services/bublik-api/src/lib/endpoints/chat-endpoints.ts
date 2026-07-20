/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2025-2026 OKTET LTD */
import { EndpointBuilder } from '@reduxjs/toolkit/query';
import { z } from 'zod';

import { BublikBaseQueryFn, withApiV2 } from '../config';
import { BUBLIK_TAG } from '../types';
import { API_REDUCER_PATH } from '../constants';

// Reasoning effort levels are admin-defined per model (free-form strings),
// so they are not constrained to a fixed set here.
export const ReasoningEffortSchema = z.string();

export type ReasoningEffort = z.infer<typeof ReasoningEffortSchema>;

export const ChatModelSchema = z.object({
	name: z.string(),
	display_name: z.string(),
	capabilities: z.record(z.unknown()),
	supports_reasoning_effort: z.boolean(),
	reasoning_efforts: z.array(z.string()),
	default_reasoning_effort: z.string().nullable()
});

export type ChatModel = z.infer<typeof ChatModelSchema>;

export const ChatProviderSchema = z.object({
	id: z.string(),
	type: z.string(),
	display_name: z.string(),
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
	created: z.string(),
	updated: z.string()
});

export type ChatThreadListItem = z.infer<typeof ChatThreadListItemSchema>;

export const ChatThreadListResponseSchema = z.array(ChatThreadListItemSchema);

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
		})
	})
};
