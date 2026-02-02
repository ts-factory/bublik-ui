/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
	RUN_SIDEBAR_KEYS,
	RunMode,
	SHARED_SIDEBAR_KEYS,
	decodeUrlFromParam,
	encodeUrlForParam,
	stripSidebarParamsFromUrl,
	extractRunIdFromUrl
} from '@/bublik/features/sidebar';

export interface UseRunSidebarStateReturn {
	// Last visited URLs (decoded from URL params)
	lastDetailsUrl: string | null;
	lastReportUrl: string | null;
	lastMode: RunMode | null;

	// Current run context from shared state
	currentRunId: string | null;

	// Computed URLs for navigation
	detailsUrl: string;
	reportUrl: string | null;
	mainLinkUrl: string;

	// Derived availability
	isDetailsAvailable: boolean;
	isReportAvailable: boolean;
	isMainLinkAvailable: boolean;

	// Update last visited state
	setLastVisited: (mode: RunMode, url: string, runId?: string) => void;
}

export function useRunSidebarState(): UseRunSidebarStateReturn {
	const [searchParams, setSearchParams] = useSearchParams();

	const lastDetailsUrl = useMemo(
		() => decodeUrlFromParam(searchParams.get(RUN_SIDEBAR_KEYS.LAST_DETAILS)),
		[searchParams]
	);
	const lastReportUrl = useMemo(
		() => decodeUrlFromParam(searchParams.get(RUN_SIDEBAR_KEYS.LAST_REPORT)),
		[searchParams]
	);

	const lastMode = useMemo<RunMode | null>(() => {
		const mode = searchParams.get(RUN_SIDEBAR_KEYS.LAST_MODE);
		if (mode === 'details' || mode === 'report') {
			return mode;
		}
		return null;
	}, [searchParams]);

	const currentRunId = useMemo(
		() => searchParams.get(SHARED_SIDEBAR_KEYS.CURRENT_RUN_ID),
		[searchParams]
	);

	const isDetailsAvailable = !!lastDetailsUrl;
	const isReportAvailable = !!lastReportUrl;
	// Main link available if we have details/report URLs OR a current run context
	const isMainLinkAvailable =
		isDetailsAvailable || isReportAvailable || !!currentRunId;

	const detailsUrl = useMemo(() => {
		if (lastDetailsUrl) return lastDetailsUrl;
		if (currentRunId) return `/runs/${currentRunId}`;
		return '/runs';
	}, [lastDetailsUrl, currentRunId]);

	const reportUrl = useMemo(() => {
		if (lastReportUrl) return lastReportUrl;
		if (currentRunId) return `/runs/${currentRunId}/report`;
		return null;
	}, [lastReportUrl, currentRunId]);

	const mainLinkUrl = useMemo(() => {
		switch (lastMode) {
			case 'details':
				return (
					lastDetailsUrl || (currentRunId ? `/runs/${currentRunId}` : '/runs')
				);
			case 'report':
				return (
					lastReportUrl ||
					(currentRunId ? `/runs/${currentRunId}/report` : '/runs')
				);
			default:
				return currentRunId ? `/runs/${currentRunId}` : '/runs';
		}
	}, [lastMode, lastDetailsUrl, lastReportUrl, currentRunId]);

	const setLastVisited = useCallback(
		(mode: RunMode, url: string, runId?: string) => {
			const newParams = new URLSearchParams(searchParams);

			newParams.set(RUN_SIDEBAR_KEYS.LAST_MODE, mode);

			const cleanedUrl = stripSidebarParamsFromUrl(url);
			const encodedUrl = encodeUrlForParam(cleanedUrl);

			switch (mode) {
				case 'details':
					newParams.set(RUN_SIDEBAR_KEYS.LAST_DETAILS, encodedUrl);
					break;
				case 'report':
					newParams.set(RUN_SIDEBAR_KEYS.LAST_REPORT, encodedUrl);
					break;
			}

			// Update shared run context
			const extractedRunId = runId || extractRunIdFromUrl(url);
			if (extractedRunId) {
				newParams.set(SHARED_SIDEBAR_KEYS.CURRENT_RUN_ID, extractedRunId);
				newParams.set(SHARED_SIDEBAR_KEYS.LAST_RUN_RUN_ID, extractedRunId);
			}

			setSearchParams(newParams, { replace: true });
		},
		[searchParams, setSearchParams]
	);

	return {
		lastDetailsUrl,
		lastReportUrl,
		lastMode,
		currentRunId,
		detailsUrl,
		reportUrl,
		mainLinkUrl,
		isDetailsAvailable,
		isReportAvailable,
		isMainLinkAvailable,
		setLastVisited
	};
}
