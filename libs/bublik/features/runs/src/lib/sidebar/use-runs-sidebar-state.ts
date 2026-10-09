/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

import { useCallback, useMemo } from 'react';

import { matchRoutePath, useRenderedLocation } from '@/router';

import {
	RUNS_CHARTS_DEFAULT_URL,
	RUNS_MODE_DEFAULT,
	RUNS_PROGRESS_DEFAULT_URL,
	RUNS_SIDEBAR_KEYS,
	RunsMode,
	getSidebarStateStringArray,
	getSidebarStateString,
	setSidebarStateValue,
	useSidebarStateWriter,
	stripSidebarParamsFromUrl
} from '@/bublik/features/sidebar';

import { useRunsSelectionUrls } from '../runs-links';

const RUNS_MODES: readonly RunsMode[] = [
	'list',
	'charts',
	'progress',
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
	lastProgressUrl: string | null;
	lastCompareUrl: string | null;
	lastMultipleUrl: string | null;
	lastMode: RunsMode | null;

	// Computed URLs for navigation
	listUrl: string;
	chartsUrl: string;
	progressUrl: string;
	compareUrl: string | null;
	multipleUrl: string | null;
	mainLinkUrl: string;

	// Update last visited state
	setLastVisited: (mode: RunsMode, url: string) => void;
}

export function useRunsSidebarState(): UseRunsSidebarStateReturn {
	// The page on screen, raw: the list URLs copy its query string as is.
	const location = useRenderedLocation();
	const searchParams = useMemo(
		() => new URLSearchParams(location.searchStr),
		[location.searchStr]
	);
	const writeSidebarState = useSidebarStateWriter();

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
	const lastProgressUrl = useMemo(
		() => getSidebarStateString(searchParams, RUNS_SIDEBAR_KEYS.LAST_PROGRESS),
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

	// When already on the runs page, preserve the active filters/query when
	// switching modes; otherwise fall back to the persisted last-visited URL so
	// we don't leak the current (unrelated) page's params into /runs.
	const isOnRunsPage = !!matchRoutePath({ to: '/runs' }, location.pathname);

	const listUrl = useMemo(() => {
		if (isOnRunsPage) {
			const params = new URLSearchParams(location.searchStr);
			params.delete('mode');
			return stripSidebarParamsFromUrl(`/runs?${params.toString()}`);
		}
		return lastListUrl || '/runs';
	}, [isOnRunsPage, location.searchStr, lastListUrl]);

	const chartsUrl = useMemo(() => {
		if (isOnRunsPage) {
			const params = new URLSearchParams(location.searchStr);
			params.set('mode', 'charts');
			return stripSidebarParamsFromUrl(`/runs?${params.toString()}`);
		}
		return lastChartsUrl || RUNS_CHARTS_DEFAULT_URL;
	}, [isOnRunsPage, location.searchStr, lastChartsUrl]);

	const progressUrl = useMemo(() => {
		if (isOnRunsPage) {
			const params = new URLSearchParams(location.searchStr);
			params.set('mode', 'progress');
			return stripSidebarParamsFromUrl(`/runs?${params.toString()}`);
		}
		return lastProgressUrl || RUNS_PROGRESS_DEFAULT_URL;
	}, [isOnRunsPage, location.searchStr, lastProgressUrl]);

	const { compareUrl, multipleUrl } = useRunsSelectionUrls(selectedRunIds);

	const mainLinkUrl = useMemo(() => {
		// `lastMode` is omitted from `_s` when it equals the shared default.
		switch (lastMode ?? RUNS_MODE_DEFAULT) {
			case 'list':
				return lastListUrl || '/runs';
			case 'charts':
				return lastChartsUrl || RUNS_CHARTS_DEFAULT_URL;
			case 'progress':
				return lastProgressUrl || RUNS_PROGRESS_DEFAULT_URL;
			case 'compare':
				return lastCompareUrl || '/compare';
			case 'multiple':
				return lastMultipleUrl || '/multiple';
		}
	}, [
		lastMode,
		lastListUrl,
		lastChartsUrl,
		lastProgressUrl,
		lastCompareUrl,
		lastMultipleUrl
	]);

	const setLastVisited = useCallback(
		(mode: RunsMode, url: string) => {
			const cleanedUrl = stripSidebarParamsFromUrl(url);

			writeSidebarState((sidebarState) => {
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
					case 'progress':
						setSidebarStateValue(
							sidebarState,
							RUNS_SIDEBAR_KEYS.LAST_PROGRESS,
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
			});
		},
		[writeSidebarState]
	);

	return {
		selectedRunIds,
		isCompareAvailable,
		isMultipleAvailable,
		lastListUrl,
		lastChartsUrl,
		lastProgressUrl,
		lastCompareUrl,
		lastMultipleUrl,
		lastMode,
		listUrl,
		chartsUrl,
		progressUrl,
		compareUrl,
		multipleUrl,
		mainLinkUrl,
		setLastVisited
	};
}
