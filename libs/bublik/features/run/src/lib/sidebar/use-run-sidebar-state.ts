/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { skipToken } from '@reduxjs/toolkit/query';

import {
	RUN_MODE_DEFAULT,
	RUN_SIDEBAR_KEYS,
	RunMode,
	SHARED_SIDEBAR_KEYS,
	getRunDetailsDefaultUrl,
	getRunIssuesDefaultUrl,
	getSidebarStateString,
	setSidebarStateValue,
	useSidebarStateWriter,
	stripSidebarParamsFromUrl,
	extractRunIdFromUrl
} from '@/bublik/features/sidebar';
import {
	useGetRunDetailsQuery,
	useGetRunIssuesQuery,
	useGetRunReportConfigsQuery
} from '@/services/bublik-api';

const RUN_MODES: readonly RunMode[] = ['details', 'report', 'issues'];

export interface UseRunSidebarStateReturn {
	lastDetailsUrl: string | null;
	lastReportUrl: string | null;
	lastIssuesUrl: string | null;
	lastMode: RunMode | null;

	// Current run context from shared state
	currentRunId: string | null;

	detailsUrl: string;
	reportUrl: string | null;
	issuesUrl: string;
	mainLinkUrl: string;

	isDetailsAvailable: boolean;
	isReportAvailable: boolean;
	isIssuesAvailable: boolean;
	isMainLinkAvailable: boolean;

	isReportLoading: boolean;
	isIssuesLoading: boolean;
	/** Issues classified in the current run; 0 means there is nothing to show. */
	issueCount: number;

	setLastVisited: (mode: RunMode, url: string, runId?: string) => void;
}

export function useRunSidebarState(): UseRunSidebarStateReturn {
	const [searchParams] = useSearchParams();
	const writeSidebarState = useSidebarStateWriter();

	const lastDetailsUrl = useMemo(
		() => getSidebarStateString(searchParams, RUN_SIDEBAR_KEYS.LAST_DETAILS),
		[searchParams]
	);
	const lastReportUrl = useMemo(
		() => getSidebarStateString(searchParams, RUN_SIDEBAR_KEYS.LAST_REPORT),
		[searchParams]
	);
	const lastIssuesUrl = useMemo(
		() => getSidebarStateString(searchParams, RUN_SIDEBAR_KEYS.LAST_ISSUES),
		[searchParams]
	);

	const lastMode = useMemo<RunMode | null>(() => {
		const mode = getSidebarStateString(
			searchParams,
			RUN_SIDEBAR_KEYS.LAST_MODE
		);

		if (mode && RUN_MODES.includes(mode as RunMode)) {
			return mode as RunMode;
		}

		return null;
	}, [searchParams]);

	const currentRunId = useMemo(
		() =>
			getSidebarStateString(searchParams, SHARED_SIDEBAR_KEYS.CURRENT_RUN_ID),
		[searchParams]
	);

	const { data: reportConfigsData, isLoading: isReportLoading } =
		useGetRunReportConfigsQuery(currentRunId ? currentRunId : skipToken);

	// Same args the issues page uses, so both share one cache entry.
	const { data: runDetails } = useGetRunDetailsQuery(
		currentRunId ? Number(currentRunId) : skipToken
	);
	const projectId = runDetails?.project_id;
	const { data: runIssues, isLoading: isIssuesLoading } = useGetRunIssuesQuery(
		currentRunId && projectId !== undefined
			? { runId: currentRunId, projectId }
			: skipToken
	);
	const issueCount = runIssues?.length ?? 0;

	const newestReportConfig = useMemo(() => {
		if (!reportConfigsData?.run_report_configs?.length) return null;
		return reportConfigsData.run_report_configs.reduce((max, config) =>
			config.id > max.id ? config : max
		);
	}, [reportConfigsData]);

	const isDetailsAvailable = !!lastDetailsUrl || !!currentRunId;
	const isReportAvailable =
		!!lastReportUrl ||
		(!!currentRunId && !!reportConfigsData?.run_report_configs?.length);
	// Unlike Details, Issues has nothing to show for a run with no classified
	// results, so it stays disabled until we know there is at least one. While
	// the count is still in flight we trust a previous visit rather than
	// flashing an enabled link that turns out to lead to an empty page.
	const isIssuesAvailable =
		!!currentRunId &&
		(isIssuesLoading || projectId === undefined
			? !!lastIssuesUrl
			: issueCount > 0);
	const isMainLinkAvailable =
		isDetailsAvailable || isReportAvailable || !!currentRunId;

	const detailsUrl = useMemo(() => {
		if (lastDetailsUrl) return lastDetailsUrl;
		if (currentRunId) return getRunDetailsDefaultUrl(currentRunId);
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

	const issuesUrl = useMemo(() => {
		if (lastIssuesUrl) return lastIssuesUrl;
		if (currentRunId) return getRunIssuesDefaultUrl(currentRunId);
		return '/runs';
	}, [lastIssuesUrl, currentRunId]);

	const mainLinkUrl = useMemo(() => {
		// `lastMode` is omitted from `_s` when it equals the shared default.
		switch (lastMode ?? RUN_MODE_DEFAULT) {
			case 'details':
				return (
					lastDetailsUrl ||
					(currentRunId ? getRunDetailsDefaultUrl(currentRunId) : '/runs')
				);
			case 'report':
				return (
					lastReportUrl ||
					(currentRunId ? `/runs/${currentRunId}/report` : '/runs')
				);
			case 'issues':
				// A run that lost (or never had) issues must not strand the Run
				// link on a page with nothing on it.
				if (!isIssuesAvailable) {
					return currentRunId ? getRunDetailsDefaultUrl(currentRunId) : '/runs';
				}

				return (
					lastIssuesUrl ||
					(currentRunId ? getRunIssuesDefaultUrl(currentRunId) : '/runs')
				);
		}
	}, [
		lastMode,
		lastDetailsUrl,
		lastReportUrl,
		lastIssuesUrl,
		currentRunId,
		isIssuesAvailable
	]);

	const setLastVisited = useCallback(
		(mode: RunMode, url: string, runId?: string) => {
			const cleanedUrl = stripSidebarParamsFromUrl(url);
			const extractedRunId = runId || extractRunIdFromUrl(cleanedUrl);

			writeSidebarState((sidebarState) => {
				setSidebarStateValue(sidebarState, RUN_SIDEBAR_KEYS.LAST_MODE, mode);

				switch (mode) {
					case 'details':
						setSidebarStateValue(
							sidebarState,
							RUN_SIDEBAR_KEYS.LAST_DETAILS,
							cleanedUrl
						);
						break;
					case 'report':
						setSidebarStateValue(
							sidebarState,
							RUN_SIDEBAR_KEYS.LAST_REPORT,
							cleanedUrl
						);
						break;
					case 'issues':
						setSidebarStateValue(
							sidebarState,
							RUN_SIDEBAR_KEYS.LAST_ISSUES,
							cleanedUrl
						);
						break;
				}

				if (extractedRunId) {
					setSidebarStateValue(
						sidebarState,
						SHARED_SIDEBAR_KEYS.CURRENT_RUN_ID,
						extractedRunId
					);
				}
			});
		},
		[writeSidebarState]
	);

	return {
		lastDetailsUrl,
		lastReportUrl,
		lastIssuesUrl,
		lastMode,
		currentRunId,
		detailsUrl,
		reportUrl,
		issuesUrl,
		mainLinkUrl,
		isDetailsAvailable,
		isReportAvailable,
		isIssuesAvailable,
		isMainLinkAvailable,
		isReportLoading,
		isIssuesLoading,
		issueCount,
		setLastVisited
	};
}
