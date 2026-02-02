/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { RUNS_SIDEBAR_KEYS, RunsMode } from '@/bublik/features/sidebar';

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

/**
 * Strips sidebar.* params from a URL to avoid recursive state growth.
 * Keeps project params.
 */
function stripSidebarParamsFromUrl(url: string): string {
	if (!url.includes('?')) return url;

	const [pathname, searchStr] = url.split('?');
	const params = new URLSearchParams(searchStr);

	// Remove all sidebar.* params
	const keysToRemove: string[] = [];
	params.forEach((_, key) => {
		if (key.startsWith('sidebar.')) {
			keysToRemove.push(key);
		}
	});
	keysToRemove.forEach((key) => params.delete(key));

	const cleanedSearch = params.toString();
	return cleanedSearch ? `${pathname}?${cleanedSearch}` : pathname;
}

/**
 * Encodes a URL for storage in a URL param (URL-encode the path and query).
 */
function encodeUrlForParam(url: string): string {
	return encodeURIComponent(url);
}

/**
 * Decodes a URL from a URL param.
 */
function decodeUrlFromParam(encoded: string | null): string | null {
	if (!encoded) return null;
	try {
		return decodeURIComponent(encoded);
	} catch {
		return null;
	}
}

export function useRunsSidebarState(): UseRunsSidebarStateReturn {
	const [searchParams, setSearchParams] = useSearchParams();

	const selectedRunIds = useMemo(
		() => searchParams.getAll(RUNS_SIDEBAR_KEYS.SELECTED),
		[searchParams]
	);

	const lastListUrl = useMemo(
		() => decodeUrlFromParam(searchParams.get(RUNS_SIDEBAR_KEYS.LAST_LIST)),
		[searchParams]
	);
	const lastChartsUrl = useMemo(
		() => decodeUrlFromParam(searchParams.get(RUNS_SIDEBAR_KEYS.LAST_CHARTS)),
		[searchParams]
	);
	const lastCompareUrl = useMemo(
		() => decodeUrlFromParam(searchParams.get(RUNS_SIDEBAR_KEYS.LAST_COMPARE)),
		[searchParams]
	);
	const lastMultipleUrl = useMemo(
		() => decodeUrlFromParam(searchParams.get(RUNS_SIDEBAR_KEYS.LAST_MULTIPLE)),
		[searchParams]
	);

	const lastMode = useMemo<RunsMode | null>(() => {
		const mode = searchParams.get(RUNS_SIDEBAR_KEYS.LAST_MODE);
		if (
			mode === 'list' ||
			mode === 'charts' ||
			mode === 'compare' ||
			mode === 'multiple'
		) {
			return mode;
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
			const newParams = new URLSearchParams(searchParams);

			newParams.set(RUNS_SIDEBAR_KEYS.LAST_MODE, mode);

			const cleanedUrl = stripSidebarParamsFromUrl(url);
			const encodedUrl = encodeUrlForParam(cleanedUrl);

			switch (mode) {
				case 'list':
					newParams.set(RUNS_SIDEBAR_KEYS.LAST_LIST, encodedUrl);
					break;
				case 'charts':
					newParams.set(RUNS_SIDEBAR_KEYS.LAST_CHARTS, encodedUrl);
					break;
				case 'compare':
					newParams.set(RUNS_SIDEBAR_KEYS.LAST_COMPARE, encodedUrl);
					break;
				case 'multiple':
					newParams.set(RUNS_SIDEBAR_KEYS.LAST_MULTIPLE, encodedUrl);
					break;
			}

			setSearchParams(newParams, { replace: true });
		},
		[searchParams, setSearchParams]
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
