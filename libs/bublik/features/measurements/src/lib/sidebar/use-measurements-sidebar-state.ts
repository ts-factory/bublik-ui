/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

import { useCallback, useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

import {
	MEASUREMENTS_SIDEBAR_KEYS,
	MeasurementsSidebarMode,
	getSidebarStateString,
	setSidebarStateValue,
	stripSidebarParamsFromUrl,
	updateSidebarStateSearchParams,
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
			getSidebarStateString(
				searchParams,
				MEASUREMENTS_SIDEBAR_KEYS.LAST_MEASUREMENTS
			),
		[searchParams]
	);

	const lastMode = useMemo<MeasurementsSidebarMode | null>(() => {
		const mode = getSidebarStateString(
			searchParams,
			MEASUREMENTS_SIDEBAR_KEYS.LAST_MODE
		);

		if (mode && MEASUREMENTS_MODES.includes(mode as MeasurementsSidebarMode)) {
			return mode as MeasurementsSidebarMode;
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
			const currentSearchParams = new URLSearchParams(window.location.search);
			const cleanedUrl = stripSidebarParamsFromUrl(url);

			const newParams = updateSidebarStateSearchParams(
				currentSearchParams,
				(sidebarState) => {
					setSidebarStateValue(
						sidebarState,
						MEASUREMENTS_SIDEBAR_KEYS.LAST_MODE,
						mode
					);
					setSidebarStateValue(
						sidebarState,
						MEASUREMENTS_SIDEBAR_KEYS.LAST_MEASUREMENTS,
						cleanedUrl
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
