/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET Labs Ltd. */
import { EndpointBuilder } from '@reduxjs/toolkit/query';

import { BublikBaseQueryFn, withApiV2 } from '../config';
import { BUBLIK_TAG } from '../types';
import { API_REDUCER_PATH } from '../constants';

import {
	CreateMcpServerInputs,
	McpServer,
	UpdateMcpServerInputs
} from '@/shared/types';

/**
 * A user's own MCP servers for the chat assistant. Header values travel in
 * request bodies only; no response ever carries one.
 */
export const mcpServerEndpoints = {
	endpoints: (
		build: EndpointBuilder<BublikBaseQueryFn, BUBLIK_TAG, API_REDUCER_PATH>
	) => ({
		getMcpServers: build.query<McpServer[], void>({
			query: () => ({
				url: withApiV2('/chat/mcp-servers'),
				cache: 'no-cache'
			}),
			providesTags: [BUBLIK_TAG.McpServers]
		}),
		createMcpServer: build.mutation<McpServer, CreateMcpServerInputs>({
			query: (body) => ({
				url: withApiV2('/chat/mcp-servers'),
				method: 'POST',
				body
			}),
			invalidatesTags: [BUBLIK_TAG.McpServers]
		}),
		updateMcpServer: build.mutation<McpServer, UpdateMcpServerInputs>({
			query: ({ id, body }) => ({
				url: withApiV2(`/chat/mcp-servers/${id}`),
				method: 'PATCH',
				body
			}),
			invalidatesTags: [BUBLIK_TAG.McpServers]
		}),
		deleteMcpServer: build.mutation<void, number>({
			query: (id) => ({
				url: withApiV2(`/chat/mcp-servers/${id}`),
				method: 'DELETE'
			}),
			invalidatesTags: [BUBLIK_TAG.McpServers]
		})
	})
};
