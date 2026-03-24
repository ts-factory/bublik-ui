/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { EndpointBuilder } from '@reduxjs/toolkit/query';
import { z } from 'zod';

import {
	AnalyticsCollectRequest,
	AnalyticsCharts,
	AnalyticsChartsSchema,
	AnalyticsEventsResponse,
	AnalyticsEventsResponseSchema,
	AnalyticsExport,
	AnalyticsExportSchema,
	AnalyticsFacets,
	AnalyticsFacetsSchema,
	AnalyticsImportRequest,
	AnalyticsImportResponse,
	AnalyticsImportResponseSchema,
	AnalyticsOverview,
	AnalyticsOverviewSchema
} from '@/shared/types';

import { BublikBaseQueryFn, withApiV2 } from '../config';
import { API_REDUCER_PATH } from '../constants';
import { BUBLIK_TAG } from '../types';

const AnalyticsQueryArgSchema = z
	.object({
		from: z.string().optional(),
		to: z.string().optional(),
		event_type: z.string().optional(),
		event_name: z.string().optional(),
		path: z.string().optional(),
		anon_id: z.string().optional(),
		app_version: z.string().optional(),
		search: z.string().optional(),
		payload_search: z.string().optional(),
		top_events_path: z.string().optional(),
		page: z.number().optional(),
		page_size: z.number().optional()
	})
	.optional();

export type AnalyticsQueryArgs = z.infer<typeof AnalyticsQueryArgSchema>;

export const analyticsEndpoints = {
	endpoints: (
		build: EndpointBuilder<BublikBaseQueryFn, BUBLIK_TAG, API_REDUCER_PATH>
	) => ({
		collectAnalytics: build.mutation<
			{ received: number },
			AnalyticsCollectRequest
		>({
			query: (body) => ({
				url: withApiV2('/analytics/collect'),
				method: 'POST',
				body
			})
		}),
		getAnalyticsOverview: build.query<AnalyticsOverview, AnalyticsQueryArgs>({
			query: (params) => ({
				url: withApiV2('/analytics/overview'),
				params,
				cache: 'no-cache'
			}),
			argSchema: AnalyticsQueryArgSchema,
			responseSchema: AnalyticsOverviewSchema,
			providesTags: [BUBLIK_TAG.Analytics]
		}),
		getAnalyticsEvents: build.query<
			AnalyticsEventsResponse,
			AnalyticsQueryArgs
		>({
			query: (params) => ({
				url: withApiV2('/analytics'),
				params,
				cache: 'no-cache'
			}),
			argSchema: AnalyticsQueryArgSchema,
			responseSchema: AnalyticsEventsResponseSchema,
			providesTags: [BUBLIK_TAG.Analytics]
		}),
		getAnalyticsFacets: build.query<AnalyticsFacets, AnalyticsQueryArgs>({
			query: (params) => ({
				url: withApiV2('/analytics/facets'),
				params,
				cache: 'no-cache'
			}),
			argSchema: AnalyticsQueryArgSchema,
			responseSchema: AnalyticsFacetsSchema,
			providesTags: [BUBLIK_TAG.Analytics]
		}),
		getAnalyticsCharts: build.query<AnalyticsCharts, AnalyticsQueryArgs>({
			query: (params) => ({
				url: withApiV2('/analytics/charts'),
				params,
				cache: 'no-cache'
			}),
			argSchema: AnalyticsQueryArgSchema,
			responseSchema: AnalyticsChartsSchema,
			providesTags: [BUBLIK_TAG.Analytics]
		}),
		getAnalyticsExport: build.query<AnalyticsExport, AnalyticsQueryArgs>({
			query: (params) => ({
				url: withApiV2('/analytics/export'),
				params,
				cache: 'no-cache'
			}),
			argSchema: AnalyticsQueryArgSchema,
			responseSchema: AnalyticsExportSchema,
			providesTags: [BUBLIK_TAG.Analytics]
		}),
		importAnalyticsData: build.mutation<
			AnalyticsImportResponse,
			AnalyticsImportRequest
		>({
			query: (body) => ({
				url: withApiV2('/analytics/import'),
				method: 'POST',
				body
			}),
			responseSchema: AnalyticsImportResponseSchema,
			invalidatesTags: [BUBLIK_TAG.Analytics]
		})
	})
};
