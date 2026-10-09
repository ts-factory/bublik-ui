/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { config } from '@/bublik/config';

import {
	AnalyticsFilterKey,
	AnalyticsQueryArgs,
	AnalyticsSearch,
	AnalyticsSearchChanges,
	ParsedQueryState
} from './admin-analytics-page.types';

const PAGE_SIZE = 100;
const PAGE_SIZE_OPTIONS = [100, 200, 300, 400, 500] as const;
const CHART_LABEL_MAX_LENGTH = 26;
type AnalyticsColorScheme = {
	chartColor: string;
	badgeStyle: {
		backgroundColor: string;
		borderColor: string;
		color: string;
	};
};

// Badges are tinted from their chart colour against the theme's surface and
// ink, so the same palette reads in light and dark
const toBadgeStyle = (
	chartColor: string
): AnalyticsColorScheme['badgeStyle'] => ({
	backgroundColor: `color-mix(in srgb, ${chartColor} 16%, hsl(var(--colors-bg-primary)))`,
	borderColor: `color-mix(in srgb, ${chartColor} 45%, hsl(var(--colors-bg-primary)))`,
	color: `color-mix(in srgb, ${chartColor} 55%, hsl(var(--colors-text-primary)))`
});

const ANALYTICS_COLOR_SCHEMES: AnalyticsColorScheme[] = [
	'#2563EB',
	'#0891B2',
	'#16A34A',
	'#65A30D',
	'#CA8A04',
	'#EA580C',
	'#DC2626',
	'#DB2777',
	'#9333EA',
	'#4F46E5',
	'#334155'
].map((chartColor) => ({ chartColor, badgeStyle: toBadgeStyle(chartColor) }));

const DEFAULT_ANALYTICS_COLOR_SCHEME = ANALYTICS_COLOR_SCHEMES[0];

const EVENT_TYPE_COLOR_SCHEMES: Record<string, AnalyticsColorScheme> = {
	page_view: ANALYTICS_COLOR_SCHEMES[0],
	event: ANALYTICS_COLOR_SCHEMES[2]
};

const splitFilterValues = (value: string | null): string[] => {
	if (!value) {
		return [];
	}

	return value
		.split(config.queryDelimiter)
		.map((item) => item.trim())
		.filter(Boolean);
};

const joinFilterValues = (values: string[]): string | undefined => {
	if (!values.length) {
		return undefined;
	}

	return values.join(config.queryDelimiter);
};

/** The first value of a key, as `URLSearchParams.get` read it; `null` when absent. */
const firstValue = (value: string | string[] | undefined): string | null => {
	const first = Array.isArray(value) ? value[0] : value;

	return first ?? null;
};

/**
 * The page's query state from the route's search: the snake_case keys pass
 * through untouched, so the URL is read as it was written.
 */
const parseAnalyticsSearch = (search: AnalyticsSearch): ParsedQueryState => {
	const get = (key: keyof AnalyticsSearch) => firstValue(search[key]);
	const page = Number(get('page') || '1');
	const pageSize = Number(get('page_size') || `${PAGE_SIZE}`);

	return {
		eventTypes: splitFilterValues(get('event_type')),
		eventNames: splitFilterValues(get('event_name')),
		paths: splitFilterValues(get('path')),
		anonIds: splitFilterValues(get('anon_id')),
		appVersions: splitFilterValues(get('app_version')),
		search: get('search') || undefined,
		payloadSearch: get('payload_search') || undefined,
		page: Number.isNaN(page) || page < 1 ? 1 : page,
		pageSize: PAGE_SIZE_OPTIONS.includes(
			pageSize as (typeof PAGE_SIZE_OPTIONS)[number]
		)
			? pageSize
			: PAGE_SIZE
	};
};

const buildQueryArgs = (queryState: ParsedQueryState): AnalyticsQueryArgs => ({
	event_type: joinFilterValues(queryState.eventTypes),
	event_name: joinFilterValues(queryState.eventNames),
	path: joinFilterValues(queryState.paths),
	anon_id: joinFilterValues(queryState.anonIds),
	app_version: joinFilterValues(queryState.appVersions),
	search: queryState.search,
	payload_search: queryState.payloadSearch,
	page: queryState.page,
	page_size: queryState.pageSize
});

/*
 * The writes below are change sets merged into the current search in key
 * order: a key already on the URL keeps its place and a new one is
 * appended, `undefined` removes one, as the `URLSearchParams` `set` and
 * `delete` calls they replace did. Every filter change goes back to page 1.
 */

const filterValuesChanges = (
	key: AnalyticsFilterKey,
	values: string[]
): AnalyticsSearchChanges => ({
	[key]: values.length ? values.join(config.queryDelimiter) : undefined,
	page: '1'
});

const queryValueChanges = (
	key: 'search' | 'payload_search',
	value?: string,
	resetPage = true
): AnalyticsSearchChanges => ({
	[key]: value || undefined,
	...(resetPage ? { page: '1' } : {})
});

const clearFilterChanges = (): AnalyticsSearchChanges => ({
	event_type: undefined,
	event_name: undefined,
	path: undefined,
	anon_id: undefined,
	app_version: undefined,
	search: undefined,
	payload_search: undefined,
	page: '1'
});

const formatAxisLabel = (value: string): string => {
	if (value.length <= CHART_LABEL_MAX_LENGTH) {
		return value;
	}

	return `${value.slice(0, CHART_LABEL_MAX_LENGTH - 1)}...`;
};

const getStableColorScheme = (value: string): AnalyticsColorScheme => {
	let hash = 0;

	for (let i = 0; i < value.length; i += 1) {
		hash = (hash << 5) - hash + value.charCodeAt(i);
		hash |= 0;
	}

	return ANALYTICS_COLOR_SCHEMES[
		Math.abs(hash) % ANALYTICS_COLOR_SCHEMES.length
	];
};

const getPathBadgeStyle = (
	path: string
): AnalyticsColorScheme['badgeStyle'] => {
	return getStableColorScheme(normalizeTrackedPath(path)).badgeStyle;
};

const getPathChartColor = (path: string): string => {
	return getStableColorScheme(normalizeTrackedPath(path)).chartColor;
};

const getEventNameBadgeStyle = (
	eventName?: string
): AnalyticsColorScheme['badgeStyle'] => {
	if (!eventName) {
		return DEFAULT_ANALYTICS_COLOR_SCHEME.badgeStyle;
	}

	return getStableColorScheme(eventName).badgeStyle;
};

const getEventNameChartColor = (eventName: string): string => {
	if (!eventName) {
		return DEFAULT_ANALYTICS_COLOR_SCHEME.chartColor;
	}

	return getStableColorScheme(eventName).chartColor;
};

const getEventTypeBadgeStyle = (
	eventType: string
): AnalyticsColorScheme['badgeStyle'] => {
	if (EVENT_TYPE_COLOR_SCHEMES[eventType]) {
		return EVENT_TYPE_COLOR_SCHEMES[eventType].badgeStyle;
	}

	return getStableColorScheme(eventType).badgeStyle;
};

const normalizeTrackedPath = (rawPath: string): string => {
	if (!rawPath) {
		return '/';
	}

	const normalizedPath =
		rawPath.length > 1 ? rawPath.replace(/\/+$/, '') : rawPath;
	const baseUrl =
		config.baseUrl.length > 1 ? config.baseUrl.replace(/\/+$/, '') : '';

	if (!baseUrl) {
		return normalizedPath;
	}

	if (normalizedPath === baseUrl) {
		return '/';
	}

	if (normalizedPath.startsWith(`${baseUrl}/`)) {
		return normalizedPath.slice(baseUrl.length) || '/';
	}

	return normalizedPath;
};

const mergeTopPathsByPath = (paths: Array<{ path: string; count: number }>) => {
	const counts = new Map<string, number>();

	for (const item of paths) {
		const normalizedPath = normalizeTrackedPath(item.path);
		const currentCount = counts.get(normalizedPath) ?? 0;
		counts.set(normalizedPath, currentCount + item.count);
	}

	return Array.from(counts.entries())
		.map(([path, count]) => ({ path, count }))
		.sort((left, right) => right.count - left.count);
};

const hasActiveFilters = (queryState: ParsedQueryState): boolean => {
	return (
		queryState.eventTypes.length > 0 ||
		queryState.eventNames.length > 0 ||
		queryState.paths.length > 0 ||
		queryState.anonIds.length > 0 ||
		queryState.appVersions.length > 0 ||
		Boolean(queryState.search) ||
		Boolean(queryState.payloadSearch)
	);
};

export {
	buildQueryArgs,
	clearFilterChanges,
	filterValuesChanges,
	formatAxisLabel,
	getEventNameBadgeStyle,
	getEventNameChartColor,
	getEventTypeBadgeStyle,
	getPathBadgeStyle,
	getPathChartColor,
	hasActiveFilters,
	mergeTopPathsByPath,
	normalizeTrackedPath,
	PAGE_SIZE,
	PAGE_SIZE_OPTIONS,
	parseAnalyticsSearch,
	queryValueChanges
};
