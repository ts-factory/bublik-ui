/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

type AnalyticsQueryArgs = {
	event_type?: string;
	event_name?: string;
	path?: string;
	anon_id?: string;
	app_version?: string;
	search?: string;
	payload_search?: string;
	page?: number;
	page_size?: number;
};

type ParsedQueryState = {
	eventTypes: string[];
	eventNames: string[];
	paths: string[];
	anonIds: string[];
	appVersions: string[];
	search?: string;
	payloadSearch?: string;
	page: number;
	pageSize: number;
};

/**
 * `/admin/analytics`'s search as its route schema types it
 * (`apps/bublik/src/routes/-search/admin-analytics.search.ts`): the backend's
 * snake_case query, every key passed through as its wire value.
 */
type AnalyticsSearch = {
	page?: string | string[];
	page_size?: string | string[];
	event_type?: string | string[];
	event_name?: string | string[];
	path?: string | string[];
	anon_id?: string | string[];
	app_version?: string | string[];
	search?: string | string[];
	payload_search?: string | string[];
};

/** A write: each key's new wire value, `undefined` to remove it. */
type AnalyticsSearchChanges = {
	[K in keyof AnalyticsSearch]?: string | undefined;
};

type AnalyticsFilterKey =
	| 'event_type'
	| 'event_name'
	| 'path'
	| 'anon_id'
	| 'app_version';

interface AdminAnalyticsPageComponentProps {
	skipQueries: boolean;
}

export type {
	AdminAnalyticsPageComponentProps,
	AnalyticsFilterKey,
	AnalyticsQueryArgs,
	AnalyticsSearch,
	AnalyticsSearchChanges,
	ParsedQueryState
};
