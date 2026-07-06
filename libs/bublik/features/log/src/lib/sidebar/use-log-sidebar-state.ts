/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

import { useCallback, useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

import {
	LOG_SIDEBAR_KEYS,
	LogSidebarMode,
	SHARED_SIDEBAR_KEYS,
	getSidebarStateString,
	setSidebarStateValue,
	stripSidebarParamsFromUrl,
	updateSidebarStateSearchParams,
	getBaseUrl,
	addModeToUrl,
	extractRunIdFromLogUrl
} from '@/bublik/features/sidebar';

const LOG_MODES: readonly LogSidebarMode[] = [
	'log',
	'infoAndlog',
	'treeAndinfoAndlog',
	'treeAndlog'
];

export interface UseLogSidebarStateReturn {
	// Last visited log page URL
	lastLogUrl: string | null;
	lastMode: LogSidebarMode | null;

	// Current run context from shared state
	currentRunId: string | null;

	// Whether log page is available (visited log OR has run context)
	isAvailable: boolean;

	// Get URL for a specific mode
	getModeUrl: (mode: LogSidebarMode) => string;
	mainLinkUrl: string;

	// Update last visited state
	setLastVisited: (mode: LogSidebarMode, url: string, runId?: string) => void;
}

export function useLogSidebarState(): UseLogSidebarStateReturn {
	const [searchParams, setSearchParams] = useSearchParams();
	const location = useLocation();

	const lastLogUrl = useMemo(
		() => getSidebarStateString(searchParams, LOG_SIDEBAR_KEYS.LAST_LOG),
		[searchParams]
	);

	const lastMode = useMemo<LogSidebarMode | null>(() => {
		const mode = getSidebarStateString(
			searchParams,
			LOG_SIDEBAR_KEYS.LAST_MODE
		);

		if (mode && LOG_MODES.includes(mode as LogSidebarMode)) {
			return mode as LogSidebarMode;
		}

		return null;
	}, [searchParams]);

	const currentRunId = useMemo(
		() =>
			getSidebarStateString(searchParams, SHARED_SIDEBAR_KEYS.CURRENT_RUN_ID),
		[searchParams]
	);

	// Available if we have a last log URL OR a current run context
	const isAvailable = !!(lastLogUrl || currentRunId);

	const getModeUrl = useCallback(
		(mode: LogSidebarMode): string => {
			if (lastLogUrl) {
				const baseUrl = getBaseUrl(lastLogUrl);
				return addModeToUrl(baseUrl, mode);
			}
			// If no last log URL but we have a current runId, construct URL
			if (currentRunId) {
				return mode === 'log'
					? `/log/${currentRunId}`
					: `/log/${currentRunId}?mode=${mode}`;
			}
			return '/log';
		},
		[lastLogUrl, currentRunId]
	);

	const mainLinkUrl = useMemo(() => {
		if (lastLogUrl) {
			return getModeUrl(lastMode || 'treeAndinfoAndlog');
		}
		if (currentRunId) {
			return getModeUrl(lastMode || 'treeAndinfoAndlog');
		}
		return '/log';
	}, [lastLogUrl, currentRunId, lastMode, getModeUrl]);

	const setLastVisited = useCallback(
		(mode: LogSidebarMode, url: string, runId?: string) => {
			const currentSearchParams = new URLSearchParams(window.location.search);
			const cleanedUrl = stripSidebarParamsFromUrl(url);
			const extractedRunId = runId || extractRunIdFromLogUrl(cleanedUrl);

			const newParams = updateSidebarStateSearchParams(
				currentSearchParams,
				(sidebarState) => {
					setSidebarStateValue(sidebarState, LOG_SIDEBAR_KEYS.LAST_MODE, mode);
					setSidebarStateValue(
						sidebarState,
						LOG_SIDEBAR_KEYS.LAST_LOG,
						cleanedUrl
					);

					if (extractedRunId) {
						setSidebarStateValue(
							sidebarState,
							SHARED_SIDEBAR_KEYS.CURRENT_RUN_ID,
							extractedRunId
						);
						setSidebarStateValue(
							sidebarState,
							SHARED_SIDEBAR_KEYS.LAST_LOG_RUN_ID,
							extractedRunId
						);
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
		lastLogUrl,
		lastMode,
		currentRunId,
		isAvailable,
		getModeUrl,
		mainLinkUrl,
		setLastVisited
	};
}
