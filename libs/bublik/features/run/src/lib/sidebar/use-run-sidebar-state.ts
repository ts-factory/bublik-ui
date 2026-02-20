/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

import { useCallback, useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { skipToken } from '@reduxjs/toolkit/query';

import {
	RUN_SIDEBAR_KEYS,
	RunMode,
	SHARED_SIDEBAR_KEYS,
	decodeUrlFromParam,
	encodeUrlForParam,
	stripSidebarParamsFromUrl,
	extractRunIdFromUrl
} from '@/bublik/features/sidebar';
import { useGetRunReportConfigsQuery } from '@/services/bublik-api';

const RUN_MODES: readonly RunMode[] = ['details', 'report'];

export interface UseRunSidebarStateReturn {
	lastDetailsUrl: string | null;
	lastReportUrl: string | null;
	lastMode: RunMode | null;

	// Current run context from shared state
	currentRunId: string | null;

	detailsUrl: string;
	reportUrl: string | null;
	mainLinkUrl: string;

	isDetailsAvailable: boolean;
	isReportAvailable: boolean;
	isMainLinkAvailable: boolean;

	isReportLoading: boolean;

	setLastVisited: (mode: RunMode, url: string, runId?: string) => void;
}

export function useRunSidebarState(): UseRunSidebarStateReturn {
	const [searchParams, setSearchParams] = useSearchParams();
	const location = useLocation();

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

		if (mode && RUN_MODES.includes(mode as RunMode)) {
			return mode as RunMode;
		}

		return null;
	}, [searchParams]);

	const currentRunId = useMemo(
		() => searchParams.get(SHARED_SIDEBAR_KEYS.CURRENT_RUN_ID),
		[searchParams]
	);

	const { data: reportConfigsData, isLoading: isReportLoading } =
		useGetRunReportConfigsQuery(currentRunId ? currentRunId : skipToken);

	const newestReportConfig = useMemo(() => {
		if (!reportConfigsData?.run_report_configs?.length) return null;
		return reportConfigsData.run_report_configs.reduce((max, config) =>
			config.id > max.id ? config : max
		);
	}, [reportConfigsData]);

	const isDetailsAvailable = !!lastDetailsUrl;
	const isReportAvailable =
		!!lastReportUrl ||
		(!!currentRunId && !!reportConfigsData?.run_report_configs?.length);
	const isMainLinkAvailable =
		isDetailsAvailable || isReportAvailable || !!currentRunId;

	const detailsUrl = useMemo(() => {
		if (lastDetailsUrl) return lastDetailsUrl;
		if (currentRunId) return `/runs/${currentRunId}`;
		return '/runs';
	}, [lastDetailsUrl, currentRunId]);

	const reportUrl = useMemo(() => {
		if (lastReportUrl) return lastReportUrl;
		if (currentRunId) {
			if (newestReportConfig) {
				return `/runs/${currentRunId}/report?config=${newestReportConfig.id}`;
			}
			return `/runs/${currentRunId}/report`;
		}
		return null;
	}, [lastReportUrl, currentRunId, newestReportConfig]);

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
			const currentSearchParams = new URLSearchParams(window.location.search);
			const newParams = new URLSearchParams(currentSearchParams);

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
			const extractedRunId = runId || extractRunIdFromUrl(url);

			if (extractedRunId) {
				newParams.set(SHARED_SIDEBAR_KEYS.CURRENT_RUN_ID, extractedRunId);
				newParams.set(SHARED_SIDEBAR_KEYS.LAST_RUN_RUN_ID, extractedRunId);
			}

			if (newParams.toString() === currentSearchParams.toString()) {
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
		isReportLoading,
		setLastVisited
	};
}
