/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { Dispatch, SetStateAction } from 'react';

import { config } from '@/bublik/config';

import {
	AnalyticsFilterKey,
	AnalyticsQueryArgs,
	ParsedQueryState
} from './admin-analytics-page.types';

const PAGE_SIZE = 25;
const CHART_LABEL_MAX_LENGTH = 26;
type AnalyticsColorScheme = {
	chartColor: string;
	badgeStyle: {
		backgroundColor: string;
		borderColor: string;
		color: string;
	};
};

const ANALYTICS_COLOR_SCHEMES: AnalyticsColorScheme[] = [
	{
		chartColor: '#2563EB',
		badgeStyle: {
			backgroundColor: '#DBEAFE',
			borderColor: '#93C5FD',
			color: '#1E3A8A'
		}
	},
	{
		chartColor: '#0891B2',
		badgeStyle: {
			backgroundColor: '#CFFAFE',
			borderColor: '#67E8F9',
			color: '#164E63'
		}
	},
	{
		chartColor: '#16A34A',
		badgeStyle: {
			backgroundColor: '#DCFCE7',
			borderColor: '#86EFAC',
			color: '#14532D'
		}
	},
	{
		chartColor: '#65A30D',
		badgeStyle: {
			backgroundColor: '#ECFCCB',
			borderColor: '#BEF264',
			color: '#365314'
		}
	},
	{
		chartColor: '#CA8A04',
		badgeStyle: {
			backgroundColor: '#FEF9C3',
			borderColor: '#FDE047',
			color: '#713F12'
		}
	},
	{
		chartColor: '#EA580C',
		badgeStyle: {
			backgroundColor: '#FFEDD5',
			borderColor: '#FDBA74',
			color: '#7C2D12'
		}
	},
	{
		chartColor: '#DC2626',
		badgeStyle: {
			backgroundColor: '#FEE2E2',
			borderColor: '#FCA5A5',
			color: '#7F1D1D'
		}
	},
	{
		chartColor: '#DB2777',
		badgeStyle: {
			backgroundColor: '#FCE7F3',
			borderColor: '#F9A8D4',
			color: '#831843'
		}
	},
	{
		chartColor: '#9333EA',
		badgeStyle: {
			backgroundColor: '#F3E8FF',
			borderColor: '#D8B4FE',
			color: '#581C87'
		}
	},
	{
		chartColor: '#4F46E5',
		badgeStyle: {
			backgroundColor: '#E0E7FF',
			borderColor: '#A5B4FC',
			color: '#312E81'
		}
	},
	{
		chartColor: '#334155',
		badgeStyle: {
			backgroundColor: '#E2E8F0',
			borderColor: '#94A3B8',
			color: '#0F172A'
		}
	}
];

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

const parseSearchParams = (searchParams: URLSearchParams): ParsedQueryState => {
	const page = Number(searchParams.get('page') || '1');

	return {
		eventTypes: splitFilterValues(searchParams.get('event_type')),
		eventNames: splitFilterValues(searchParams.get('event_name')),
		paths: splitFilterValues(searchParams.get('path')),
		anonIds: splitFilterValues(searchParams.get('anon_id')),
		appVersions: splitFilterValues(searchParams.get('app_version')),
		search: searchParams.get('search') || undefined,
		payloadSearch: searchParams.get('payload_search') || undefined,
		page: Number.isNaN(page) || page < 1 ? 1 : page
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
	page_size: PAGE_SIZE
});

const updateQueryValues = (
	params: URLSearchParams,
	key: AnalyticsFilterKey,
	values: string[]
) => {
	if (!values.length) {
		params.delete(key);
	} else {
		params.set(key, values.join(config.queryDelimiter));
	}

	params.set('page', '1');
};

const updateQueryValue = (
	params: URLSearchParams,
	key: 'search' | 'payload_search',
	value?: string,
	resetPage = true
) => {
	if (!value) {
		params.delete(key);
	} else {
		params.set(key, value);
	}

	if (resetPage) {
		params.set('page', '1');
	}
};

const clearFilterParams = (params: URLSearchParams) => {
	params.delete('event_type');
	params.delete('event_name');
	params.delete('path');
	params.delete('anon_id');
	params.delete('app_version');
	params.delete('search');
	params.delete('payload_search');
	params.set('page', '1');
};

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

type SetSearchParams = Dispatch<SetStateAction<URLSearchParams>>;

export {
	buildQueryArgs,
	clearFilterParams,
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
	parseSearchParams,
	updateQueryValue,
	updateQueryValues
};
export type { SetSearchParams };
