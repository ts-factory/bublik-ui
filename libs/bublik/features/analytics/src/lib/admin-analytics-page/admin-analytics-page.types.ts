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
	ParsedQueryState
};
