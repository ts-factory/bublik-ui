/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { z } from 'zod';

export const AnalyticsEventSchema = z.object({
	id: z.number(),
	event_uuid: z.string().uuid(),
	event_type: z.string(),
	event_name: z.string(),
	path: z.string(),
	anon_id: z.string(),
	session_id: z.string(),
	browser_name: z.string(),
	browser_version: z.string(),
	os_name: z.string(),
	user_agent: z.string(),
	app_version: z.string(),
	payload: z.unknown(),
	occurred_at: z.string(),
	created_at: z.string()
});

export const AnalyticsOverviewSchema = z.object({
	total_events: z.number(),
	page_views: z.number(),
	unique_anonymous_users: z.number(),
	top_event_names: z.array(
		z.object({
			event_name: z.string(),
			count: z.number()
		})
	),
	top_paths: z.array(
		z.object({
			path: z.string(),
			count: z.number()
		})
	)
});

export const AnalyticsFacetValueSchema = z.object({
	value: z.string(),
	count: z.number()
});

export const AnalyticsFacetsSchema = z.object({
	event_types: z.array(AnalyticsFacetValueSchema),
	event_names: z.array(AnalyticsFacetValueSchema),
	paths: z.array(AnalyticsFacetValueSchema),
	anon_ids: z.array(AnalyticsFacetValueSchema),
	app_versions: z.array(AnalyticsFacetValueSchema)
});

export const AnalyticsChartPathSchema = z.object({
	path: z.string(),
	count: z.number()
});

export const AnalyticsChartEventSchema = z.object({
	event_name: z.string(),
	count: z.number()
});

export const AnalyticsChartsSchema = z.object({
	top_events_path: z.string(),
	top_paths: z.array(AnalyticsChartPathSchema),
	top_events: z.array(AnalyticsChartEventSchema)
});

export const AnalyticsEventsResponseSchema = z.object({
	pagination: z.object({ count: z.number() }),
	results: z.array(AnalyticsEventSchema)
});

export const AnalyticsCollectEventSchema = z.object({
	event_uuid: z.string().uuid().optional(),
	event_type: z.string(),
	event_name: z.string().optional(),
	path: z.string().optional(),
	anon_id: z.string().optional(),
	session_id: z.string().optional(),
	browser_name: z.string().optional(),
	browser_version: z.string().optional(),
	os_name: z.string().optional(),
	user_agent: z.string().optional(),
	app_version: z.string().optional(),
	payload: z.unknown().optional(),
	occurred_at: z.string().optional()
});

export const AnalyticsCollectRequestSchema = z.object({
	events: z.array(AnalyticsCollectEventSchema).min(1)
});

export const AnalyticsExportSchema = z.object({
	schema_version: z.literal(1),
	exported_at: z.string(),
	count: z.number(),
	events: z.array(AnalyticsEventSchema)
});

export const AnalyticsImportRequestSchema = z.object({
	schema_version: z.literal(1),
	events: z.array(AnalyticsCollectEventSchema).min(1)
});

export const AnalyticsImportResponseSchema = z.object({
	imported: z.number(),
	skipped: z.number()
});

export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;
export type AnalyticsOverview = z.infer<typeof AnalyticsOverviewSchema>;
export type AnalyticsFacetValue = z.infer<typeof AnalyticsFacetValueSchema>;
export type AnalyticsFacets = z.infer<typeof AnalyticsFacetsSchema>;
export type AnalyticsCharts = z.infer<typeof AnalyticsChartsSchema>;
export type AnalyticsEventsResponse = z.infer<
	typeof AnalyticsEventsResponseSchema
>;
export type AnalyticsCollectEventInput = z.infer<
	typeof AnalyticsCollectEventSchema
>;
export type AnalyticsCollectRequest = z.infer<
	typeof AnalyticsCollectRequestSchema
>;
export type AnalyticsExport = z.infer<typeof AnalyticsExportSchema>;
export type AnalyticsImportRequest = z.infer<
	typeof AnalyticsImportRequestSchema
>;
export type AnalyticsImportResponse = z.infer<
	typeof AnalyticsImportResponseSchema
>;
