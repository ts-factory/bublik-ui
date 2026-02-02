/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
	MEASUREMENTS_SIDEBAR_KEYS,
	MeasurementsSidebarMode
} from '@/bublik/features/sidebar';

export interface UseMeasurementsSidebarStateReturn {
	// Last visited measurements page URL
	lastMeasurementsUrl: string | null;
	lastMode: MeasurementsSidebarMode | null;

	// Whether measurements page has been visited at all
	isAvailable: boolean;

	// Get URL for a specific mode
	getModeUrl: (mode: MeasurementsSidebarMode) => string;
	mainLinkUrl: string;

	// Update last visited state
	setLastVisited: (mode: MeasurementsSidebarMode, url: string) => void;
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
 * Encodes a URL for storage in a URL param.
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

/**
 * Gets base URL without mode parameter.
 */
function getBaseUrl(url: string): string {
	if (!url.includes('?')) return url;
	const [pathname, searchStr] = url.split('?');
	const params = new URLSearchParams(searchStr);
	params.delete('mode');
	const search = params.toString();
	return search ? `${pathname}?${search}` : pathname;
}

/**
 * Adds mode parameter to URL.
 */
function addModeToUrl(baseUrl: string, mode: MeasurementsSidebarMode): string {
	if (!baseUrl.includes('?')) {
		return mode === 'default' ? baseUrl : `${baseUrl}?mode=${mode}`;
	}
	const [pathname, searchStr] = baseUrl.split('?');
	const params = new URLSearchParams(searchStr);
	if (mode === 'default') {
		params.delete('mode');
	} else {
		params.set('mode', mode);
	}
	const search = params.toString();
	return search ? `${pathname}?${search}` : pathname;
}

export function useMeasurementsSidebarState(): UseMeasurementsSidebarStateReturn {
	const [searchParams, setSearchParams] = useSearchParams();

	const lastMeasurementsUrl = useMemo(
		() =>
			decodeUrlFromParam(
				searchParams.get(MEASUREMENTS_SIDEBAR_KEYS.LAST_MEASUREMENTS)
			),
		[searchParams]
	);

	const lastMode = useMemo<MeasurementsSidebarMode | null>(() => {
		const mode = searchParams.get(MEASUREMENTS_SIDEBAR_KEYS.LAST_MODE);
		if (
			mode === 'default' ||
			mode === 'charts' ||
			mode === 'tables' ||
			mode === 'split' ||
			mode === 'overlay'
		) {
			return mode;
		}
		return null;
	}, [searchParams]);

	const isAvailable = !!lastMeasurementsUrl;

	const getModeUrl = useCallback(
		(mode: MeasurementsSidebarMode): string => {
			if (!lastMeasurementsUrl) return '/runs';
			const baseUrl = getBaseUrl(lastMeasurementsUrl);
			return addModeToUrl(baseUrl, mode);
		},
		[lastMeasurementsUrl]
	);

	const mainLinkUrl = useMemo(() => {
		if (!lastMeasurementsUrl) return '/runs';
		return getModeUrl(lastMode || 'default');
	}, [lastMeasurementsUrl, lastMode, getModeUrl]);

	const setLastVisited = useCallback(
		(mode: MeasurementsSidebarMode, url: string) => {
			const newParams = new URLSearchParams(searchParams);

			newParams.set(MEASUREMENTS_SIDEBAR_KEYS.LAST_MODE, mode);

			const cleanedUrl = stripSidebarParamsFromUrl(url);
			const encodedUrl = encodeUrlForParam(cleanedUrl);

			newParams.set(MEASUREMENTS_SIDEBAR_KEYS.LAST_MEASUREMENTS, encodedUrl);

			setSearchParams(newParams, { replace: true });
		},
		[searchParams, setSearchParams]
	);

	return {
		lastMeasurementsUrl,
		lastMode,
		isAvailable,
		getModeUrl,
		mainLinkUrl,
		setLastVisited
	};
}
