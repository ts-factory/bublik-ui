/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
	MEASUREMENTS_SIDEBAR_KEYS,
	MeasurementsSidebarMode,
	decodeUrlFromParam,
	encodeUrlForParam,
	stripSidebarParamsFromUrl,
	getBaseUrl,
	addModeToUrl
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
