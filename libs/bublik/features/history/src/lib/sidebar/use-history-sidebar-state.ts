/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

import { useCallback, useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { skipToken } from '@reduxjs/toolkit/query';

import {
	HISTORY_SIDEBAR_KEYS,
	HistorySidebarMode,
	getSidebarStateString,
	setSidebarStateValue,
	updateSidebarStateSearchParams,
	stripSidebarParamsFromUrl
} from '@/bublik/features/sidebar';
import {
	useGetHistoryLinearQuery,
	useGetMeasurementsQuery,
	bublikAPI
} from '@/services/bublik-api';
import { useHistoryQuery } from '../hooks';

const HISTORY_MODES: readonly HistorySidebarMode[] = [
	'linear',
	'aggregation',
	'trend',
	'series',
	'stacked'
];

export interface UseHistorySidebarStateReturn {
	// Data availability flags
	hasTrendData: boolean;
	hasSeriesData: boolean;
	isStackedAvailable: boolean;

	// Loading states
	isTrendLoading: boolean;
	isSeriesLoading: boolean;

	// Last visited URLs
	lastLinearUrl: string | null;
	lastAggregationUrl: string | null;
	lastTrendUrl: string | null;
	lastSeriesUrl: string | null;
	lastStackedUrl: string | null;
	lastMode: HistorySidebarMode | null;

	// Computed URLs for navigation
	linearUrl: string;
	aggregationUrl: string;
	trendUrl: string;
	seriesUrl: string;
	stackedUrl: string | null;
	mainLinkUrl: string;

	// Update function
	setLastVisited: (mode: HistorySidebarMode, url: string) => void;
}

export function useHistorySidebarState(): UseHistorySidebarStateReturn {
	const [searchParams, setSearchParams] = useSearchParams();
	const location = useLocation();
	const { query } = useHistoryQuery();

	// Fetch trend charts data
	const { data: linearData } = useGetHistoryLinearQuery(
		query.testName ? query : skipToken
	);
	const { data: trendData, isFetching: isTrendLoading } =
		bublikAPI.useGetTrendChartsQuery(
			linearData ? linearData.results_ids : skipToken
		);

	const { data: seriesData, isFetching: isSeriesLoading } =
		useGetMeasurementsQuery(linearData ? linearData.results_ids : skipToken);

	// Check if stacked charts are available (has selected charts)
	const combinedPlots = searchParams.get('combinedPlots');
	const isStackedAvailable = !!combinedPlots && combinedPlots.length > 0;

	// Check data availability
	const hasTrendData = !!trendData && trendData.length > 0;
	const hasSeriesData = !!seriesData && seriesData.length > 0;

	// Decode stored URLs
	const lastLinearUrl = useMemo(
		() => getSidebarStateString(searchParams, HISTORY_SIDEBAR_KEYS.LAST_LINEAR),
		[searchParams]
	);
	const lastAggregationUrl = useMemo(
		() =>
			getSidebarStateString(
				searchParams,
				HISTORY_SIDEBAR_KEYS.LAST_AGGREGATION
			),
		[searchParams]
	);
	const lastTrendUrl = useMemo(
		() => getSidebarStateString(searchParams, HISTORY_SIDEBAR_KEYS.LAST_TREND),
		[searchParams]
	);
	const lastSeriesUrl = useMemo(
		() => getSidebarStateString(searchParams, HISTORY_SIDEBAR_KEYS.LAST_SERIES),
		[searchParams]
	);
	const lastStackedUrl = useMemo(
		() =>
			getSidebarStateString(searchParams, HISTORY_SIDEBAR_KEYS.LAST_STACKED),
		[searchParams]
	);

	const lastMode = useMemo<HistorySidebarMode | null>(() => {
		const mode = getSidebarStateString(
			searchParams,
			HISTORY_SIDEBAR_KEYS.LAST_MODE
		);

		if (mode && HISTORY_MODES.includes(mode as HistorySidebarMode)) {
			return mode as HistorySidebarMode;
		}

		return null;
	}, [searchParams]);

	// Build base URL from current search params (preserving testName and filters)
	const buildBaseUrl = useCallback(
		(mode?: string) => {
			const params = new URLSearchParams(searchParams);
			if (mode) {
				params.set('mode', mode);
			}
			return `/history?${params.toString()}`;
		},
		[searchParams]
	);

	// Computed URLs for each mode
	const linearUrl = useMemo(() => {
		const params = new URLSearchParams(searchParams);
		params.set('mode', 'linear');
		return `/history?${params.toString()}`;
	}, [searchParams]);

	const aggregationUrl = useMemo(() => {
		const params = new URLSearchParams(searchParams);
		params.set('mode', 'aggregation');
		return `/history?${params.toString()}`;
	}, [searchParams]);

	const trendUrl = useMemo(() => {
		// If we have current data, use current URL
		if (hasTrendData) {
			return buildBaseUrl('measurements');
		}
		// Otherwise use stored URL or default
		return lastTrendUrl || buildBaseUrl('measurements');
	}, [hasTrendData, lastTrendUrl, buildBaseUrl]);

	const seriesUrl = useMemo(() => {
		// If we have current data, use current URL
		if (hasSeriesData) {
			return buildBaseUrl('measurements-by-iteration');
		}
		// Otherwise use stored URL or default
		return lastSeriesUrl || buildBaseUrl('measurements-by-iteration');
	}, [hasSeriesData, lastSeriesUrl, buildBaseUrl]);

	const stackedUrl = useMemo(() => {
		if (!isStackedAvailable) return null;
		return buildBaseUrl('measurements-combined');
	}, [isStackedAvailable, buildBaseUrl]);

	// Main link URL based on last visited mode
	const mainLinkUrl = useMemo(() => {
		switch (lastMode) {
			case 'linear':
				return lastLinearUrl || linearUrl;
			case 'aggregation':
				return lastAggregationUrl || aggregationUrl;
			case 'trend':
				return lastTrendUrl || trendUrl;
			case 'series':
				return lastSeriesUrl || seriesUrl;
			case 'stacked':
				return lastStackedUrl || stackedUrl || linearUrl;
			default:
				return linearUrl;
		}
	}, [
		lastMode,
		lastLinearUrl,
		lastAggregationUrl,
		lastTrendUrl,
		lastSeriesUrl,
		lastStackedUrl,
		linearUrl,
		aggregationUrl,
		trendUrl,
		seriesUrl,
		stackedUrl
	]);

	// Update last visited state
	const setLastVisited = useCallback(
		(mode: HistorySidebarMode, url: string) => {
			const currentSearchParams = new URLSearchParams(window.location.search);
			const cleanedUrl = stripSidebarParamsFromUrl(url);

			const newParams = updateSidebarStateSearchParams(
				currentSearchParams,
				(sidebarState) => {
					setSidebarStateValue(
						sidebarState,
						HISTORY_SIDEBAR_KEYS.LAST_MODE,
						mode
					);

					switch (mode) {
						case 'linear':
							setSidebarStateValue(
								sidebarState,
								HISTORY_SIDEBAR_KEYS.LAST_LINEAR,
								cleanedUrl
							);
							break;
						case 'aggregation':
							setSidebarStateValue(
								sidebarState,
								HISTORY_SIDEBAR_KEYS.LAST_AGGREGATION,
								cleanedUrl
							);
							break;
						case 'trend':
							setSidebarStateValue(
								sidebarState,
								HISTORY_SIDEBAR_KEYS.LAST_TREND,
								cleanedUrl
							);
							break;
						case 'series':
							setSidebarStateValue(
								sidebarState,
								HISTORY_SIDEBAR_KEYS.LAST_SERIES,
								cleanedUrl
							);
							break;
						case 'stacked':
							setSidebarStateValue(
								sidebarState,
								HISTORY_SIDEBAR_KEYS.LAST_STACKED,
								cleanedUrl
							);
							break;
					}
				}
			);

			if (!newParams) {
				return;
			}

			setSearchParams(newParams, {
				replace: true,
				state: location.state
			});
		},
		[location.state, setSearchParams]
	);

	return {
		hasTrendData,
		hasSeriesData,
		isStackedAvailable,
		isTrendLoading,
		isSeriesLoading,
		lastLinearUrl,
		lastAggregationUrl,
		lastTrendUrl,
		lastSeriesUrl,
		lastStackedUrl,
		lastMode,
		linearUrl,
		aggregationUrl,
		trendUrl,
		seriesUrl,
		stackedUrl,
		mainLinkUrl,
		setLastVisited
	};
}
