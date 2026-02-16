/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

import { useCallback, useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

import {
	MEASUREMENTS_SIDEBAR_KEYS,
	MeasurementsSidebarMode,
	decodeUrlFromParam,
	parseModeParam,
	setEncodedUrlParam,
	getUpdatedSearchParams,
	getBaseUrl,
	addModeToUrl
} from '@/bublik/features/sidebar';

const MEASUREMENTS_MODES: readonly MeasurementsSidebarMode[] = [
	'default',
	'charts',
	'tables',
	'split',
	'overlay'
];

export interface UseMeasurementsSidebarStateReturn {
	lastMeasurementsUrl: string | null;
	lastMode: MeasurementsSidebarMode | null;

	isAvailable: boolean;

	getModeUrl: (mode: MeasurementsSidebarMode) => string;
	mainLinkUrl: string;

	setLastVisited: (mode: MeasurementsSidebarMode, url: string) => void;
}

export function useMeasurementsSidebarState(): UseMeasurementsSidebarStateReturn {
	const [searchParams, setSearchParams] = useSearchParams();
	const location = useLocation();

	const lastMeasurementsUrl = useMemo(
		() =>
			decodeUrlFromParam(
				searchParams.get(MEASUREMENTS_SIDEBAR_KEYS.LAST_MEASUREMENTS)
			),
		[searchParams]
	);

	const lastMode = useMemo<MeasurementsSidebarMode | null>(
		() =>
			parseModeParam(
				searchParams,
				MEASUREMENTS_SIDEBAR_KEYS.LAST_MODE,
				MEASUREMENTS_MODES
			),
		[searchParams]
	);

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
			const currentSearchParams = new URLSearchParams(window.location.search);

			const newParams = getUpdatedSearchParams(
				currentSearchParams,
				(nextParams) => {
					nextParams.set(MEASUREMENTS_SIDEBAR_KEYS.LAST_MODE, mode);
					setEncodedUrlParam(
						nextParams,
						MEASUREMENTS_SIDEBAR_KEYS.LAST_MEASUREMENTS,
						url
					);
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
		lastMeasurementsUrl,
		lastMode,
		isAvailable,
		getModeUrl,
		mainLinkUrl,
		setLastVisited
	};
}
