/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

import { useCallback, useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

import {
	RUNS_SIDEBAR_KEYS,
	RunsMode,
	getSidebarStateStringArray,
	getSidebarStateString,
	setSidebarStateValue,
	updateSidebarStateSearchParams,
	stripSidebarParamsFromUrl
} from '@/bublik/features/sidebar';

const RUNS_MODES: readonly RunsMode[] = [
	'list',
	'charts',
	'compare',
	'multiple'
];

export interface UseRunsSidebarStateReturn {
	// Selection state
	selectedRunIds: string[];

	// Derived availability
	isCompareAvailable: boolean;
	isMultipleAvailable: boolean;

	// Last visited URLs (decoded from URL params)
	lastListUrl: string | null;
	lastChartsUrl: string | null;
	lastCompareUrl: string | null;
	lastMultipleUrl: string | null;
	lastMode: RunsMode | null;

	// Computed URLs for navigation
	listUrl: string;
	chartsUrl: string;
	compareUrl: string | null;
	multipleUrl: string | null;
	mainLinkUrl: string;

	// Update last visited state
	setLastVisited: (mode: RunsMode, url: string) => void;
}

export function useRunsSidebarState(): UseRunsSidebarStateReturn {
	const [searchParams, setSearchParams] = useSearchParams();
	const location = useLocation();

	const selectedRunIds = useMemo(
		() => getSidebarStateStringArray(searchParams, RUNS_SIDEBAR_KEYS.SELECTED),
		[searchParams]
	);

	const lastListUrl = useMemo(
		() => getSidebarStateString(searchParams, RUNS_SIDEBAR_KEYS.LAST_LIST),
		[searchParams]
	);
	const lastChartsUrl = useMemo(
		() => getSidebarStateString(searchParams, RUNS_SIDEBAR_KEYS.LAST_CHARTS),
		[searchParams]
	);
	const lastCompareUrl = useMemo(
		() => getSidebarStateString(searchParams, RUNS_SIDEBAR_KEYS.LAST_COMPARE),
		[searchParams]
	);
	const lastMultipleUrl = useMemo(
		() => getSidebarStateString(searchParams, RUNS_SIDEBAR_KEYS.LAST_MULTIPLE),
		[searchParams]
	);

	const lastMode = useMemo<RunsMode | null>(() => {
		const mode = getSidebarStateString(
			searchParams,
			RUNS_SIDEBAR_KEYS.LAST_MODE
		);

		if (mode && RUNS_MODES.includes(mode as RunsMode)) {
			return mode as RunsMode;
		}

		return null;
	}, [searchParams]);

	const isCompareAvailable = selectedRunIds.length === 2;
	const isMultipleAvailable = selectedRunIds.length >= 2;

	const listUrl = useMemo(() => '/runs', []);
	const chartsUrl = useMemo(() => '/runs?mode=charts', []);

	const compareUrl = useMemo(() => {
		if (!isCompareAvailable) return null;
		return `/compare?left=${selectedRunIds[0]}&right=${selectedRunIds[1]}`;
	}, [isCompareAvailable, selectedRunIds]);

	const multipleUrl = useMemo(() => {
		if (!isMultipleAvailable) return null;
		const params = new URLSearchParams();
		selectedRunIds.forEach((id: string) => params.append('runIds', id));
		return `/multiple?${params.toString()}`;
	}, [isMultipleAvailable, selectedRunIds]);

	const mainLinkUrl = useMemo(() => {
		switch (lastMode) {
			case 'list':
				return lastListUrl || '/runs';
			case 'charts':
				return lastChartsUrl || '/runs?mode=charts';
			case 'compare':
				return lastCompareUrl || '/compare';
			case 'multiple':
				return lastMultipleUrl || '/multiple';
			default:
				return '/runs';
		}
	}, [lastMode, lastListUrl, lastChartsUrl, lastCompareUrl, lastMultipleUrl]);

	const setLastVisited = useCallback(
		(mode: RunsMode, url: string) => {
			const currentSearchParams = new URLSearchParams(window.location.search);
			const cleanedUrl = stripSidebarParamsFromUrl(url);

			const newParams = updateSidebarStateSearchParams(
				currentSearchParams,
				(sidebarState) => {
					setSidebarStateValue(sidebarState, RUNS_SIDEBAR_KEYS.LAST_MODE, mode);

					switch (mode) {
						case 'list':
							setSidebarStateValue(
								sidebarState,
								RUNS_SIDEBAR_KEYS.LAST_LIST,
								cleanedUrl
							);
							break;
						case 'charts':
							setSidebarStateValue(
								sidebarState,
								RUNS_SIDEBAR_KEYS.LAST_CHARTS,
								cleanedUrl
							);
							break;
						case 'compare':
							setSidebarStateValue(
								sidebarState,
								RUNS_SIDEBAR_KEYS.LAST_COMPARE,
								cleanedUrl
							);
							break;
						case 'multiple':
							setSidebarStateValue(
								sidebarState,
								RUNS_SIDEBAR_KEYS.LAST_MULTIPLE,
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
		selectedRunIds,
		isCompareAvailable,
		isMultipleAvailable,
		lastListUrl,
		lastChartsUrl,
		lastCompareUrl,
		lastMultipleUrl,
		lastMode,
		listUrl,
		chartsUrl,
		compareUrl,
		multipleUrl,
		mainLinkUrl,
		setLastVisited
	};
}
