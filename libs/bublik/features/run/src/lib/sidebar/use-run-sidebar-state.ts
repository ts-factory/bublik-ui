/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

import { useCallback, useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
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
	extractRunIdFromUrl,
	extractRunIdFromLogUrl
} from '@/bublik/features/sidebar';
import {
	useGetRunDetailsQuery,
	useGetRunIssuesQuery,
	useGetRunReportConfigsQuery
} from '@/services/bublik-api';

const RUN_MODES: readonly RunMode[] = ['details', 'report', 'issues'];

const RUN_URL_KEY_BY_MODE: Record<RunMode, string> = {
	details: RUN_SIDEBAR_KEYS.LAST_DETAILS,
	report: RUN_SIDEBAR_KEYS.LAST_REPORT,
	issues: RUN_SIDEBAR_KEYS.LAST_ISSUES
};

const RUN_URL_KEYS = Object.values(RUN_URL_KEY_BY_MODE);

export interface UseRunSidebarStateReturn {
	/** Remembered URLs, but only while they belong to `activeRunId`. */
	lastDetailsUrl: string | null;
	lastReportUrl: string | null;
	lastIssuesUrl: string | null;
	lastMode: RunMode | null;

	// Current run context from shared state
	currentRunId: string | null;
	/** The run every link and the issue count describe. */
	activeRunId: string | null;

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
	/** Issues classified in the active run; 0 means there is nothing to show. */
	issueCount: number;

	setLastVisited: (mode: RunMode, url: string, runId?: string) => void;
}

/**
 * Every sub-item is anchored to one run id, so the Details link, the Issues
 * link and the issue-count badge can never describe different runs.
 *
 * The route wins over the remembered `currentRunId`: it is authoritative and
 * available on the same render, whereas `_s` only catches up after the writer
 * effect navigates, which used to flash the previous run's count. A remembered
 * per-mode URL is honoured only while it belongs to that run -- `setLastVisited`
 * rewrites one key at a time, so the siblings are routinely a run behind.
 */
export function useRunSidebarState(): UseRunSidebarStateReturn {
	const [searchParams] = useSearchParams();
	const location = useLocation();
	const writeSidebarState = useSidebarStateWriter();

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

	const activeRunId = useMemo(
		() =>
			extractRunIdFromUrl(location.pathname) ??
			extractRunIdFromLogUrl(location.pathname) ??
			currentRunId,
		[location.pathname, currentRunId]
	);

	const scopeToActiveRun = useCallback(
		(url: string | null) =>
			url && activeRunId && extractRunIdFromUrl(url) === activeRunId
				? url
				: null,
		[activeRunId]
	);

	const lastDetailsUrl = useMemo(
		() =>
			scopeToActiveRun(
				getSidebarStateString(searchParams, RUN_SIDEBAR_KEYS.LAST_DETAILS)
			),
		[searchParams, scopeToActiveRun]
	);
	const lastReportUrl = useMemo(
		() =>
			scopeToActiveRun(
				getSidebarStateString(searchParams, RUN_SIDEBAR_KEYS.LAST_REPORT)
			),
		[searchParams, scopeToActiveRun]
	);
	const lastIssuesUrl = useMemo(
		() =>
			scopeToActiveRun(
				getSidebarStateString(searchParams, RUN_SIDEBAR_KEYS.LAST_ISSUES)
			),
		[searchParams, scopeToActiveRun]
	);

	const { data: reportConfigsData, isLoading: isReportLoading } =
		useGetRunReportConfigsQuery(activeRunId ? activeRunId : skipToken);

	// Same args the issues page uses, so both share one cache entry.
	const { data: runDetails } = useGetRunDetailsQuery(
		activeRunId ? Number(activeRunId) : skipToken
	);
	const projectId = runDetails?.project_id;
	const { data: runIssues, isLoading: isIssuesLoading } = useGetRunIssuesQuery(
		activeRunId && projectId !== undefined
			? { runId: activeRunId, projectId }
			: skipToken
	);
	const issueCount = runIssues?.length ?? 0;

	const newestReportConfig = useMemo(() => {
		if (!reportConfigsData?.run_report_configs?.length) return null;
		return reportConfigsData.run_report_configs.reduce((max, config) =>
			config.id > max.id ? config : max
		);
	}, [reportConfigsData]);

	const isDetailsAvailable = !!lastDetailsUrl || !!activeRunId;
	const isReportAvailable =
		!!lastReportUrl ||
		(!!activeRunId && !!reportConfigsData?.run_report_configs?.length);
	// Unlike Details, Issues has nothing to show for a run with no classified
	// results, so it stays disabled until we know there is at least one. While
	// the count is still in flight we trust a previous visit to *this* run
	// rather than flashing an enabled link that turns out to lead to an empty
	// page -- or being disabled on the very page we are standing on.
	const isOnIssuesPage =
		!!activeRunId && location.pathname === getRunIssuesDefaultUrl(activeRunId);
	const isIssuesAvailable =
		!!activeRunId &&
		(isIssuesLoading || projectId === undefined
			? !!lastIssuesUrl || isOnIssuesPage
			: issueCount > 0);
	const isMainLinkAvailable =
		isDetailsAvailable || isReportAvailable || !!activeRunId;

	const detailsUrl = useMemo(() => {
		if (lastDetailsUrl) return lastDetailsUrl;
		if (activeRunId) return getRunDetailsDefaultUrl(activeRunId);
		return '/runs';
	}, [lastDetailsUrl, activeRunId]);

	const reportUrl = useMemo(() => {
		if (lastReportUrl) return lastReportUrl;
		if (activeRunId) {
			if (newestReportConfig) {
				return `/runs/${activeRunId}/report?config=${newestReportConfig.id}`;
			}
			return `/runs/${activeRunId}/report`;
		}
		return null;
	}, [lastReportUrl, activeRunId, newestReportConfig]);

	const issuesUrl = useMemo(() => {
		if (lastIssuesUrl) return lastIssuesUrl;
		if (activeRunId) return getRunIssuesDefaultUrl(activeRunId);
		return '/runs';
	}, [lastIssuesUrl, activeRunId]);

	const mainLinkUrl = useMemo(() => {
		// `lastMode` is omitted from `_s` when it equals the shared default.
		switch (lastMode ?? RUN_MODE_DEFAULT) {
			case 'details':
				return (
					lastDetailsUrl ||
					(activeRunId ? getRunDetailsDefaultUrl(activeRunId) : '/runs')
				);
			case 'report':
				return (
					lastReportUrl ||
					(activeRunId ? `/runs/${activeRunId}/report` : '/runs')
				);
			case 'issues':
				// A run that lost (or never had) issues must not strand the Run
				// link on a page with nothing on it.
				if (!isIssuesAvailable) {
					return activeRunId ? getRunDetailsDefaultUrl(activeRunId) : '/runs';
				}

				return (
					lastIssuesUrl ||
					(activeRunId ? getRunIssuesDefaultUrl(activeRunId) : '/runs')
				);
		}
	}, [
		lastMode,
		lastDetailsUrl,
		lastReportUrl,
		lastIssuesUrl,
		activeRunId,
		isIssuesAvailable
	]);

	const setLastVisited = useCallback(
		(mode: RunMode, url: string, runId?: string) => {
			const cleanedUrl = stripSidebarParamsFromUrl(url);
			const extractedRunId = runId || extractRunIdFromUrl(cleanedUrl);

			writeSidebarState((sidebarState) => {
				setSidebarStateValue(sidebarState, RUN_SIDEBAR_KEYS.LAST_MODE, mode);

				if (extractedRunId) {
					// Moving to another run invalidates the URLs remembered for the
					// previous one. The read side scopes them away regardless;
					// dropping them here keeps them from eating the `_s` budget.
					if (
						sidebarState[SHARED_SIDEBAR_KEYS.CURRENT_RUN_ID] !== extractedRunId
					) {
						RUN_URL_KEYS.forEach((key) =>
							setSidebarStateValue(sidebarState, key, null)
						);
					}

					setSidebarStateValue(
						sidebarState,
						SHARED_SIDEBAR_KEYS.CURRENT_RUN_ID,
						extractedRunId
					);
				}

				// After the clear above, so the mode being recorded survives it.
				setSidebarStateValue(
					sidebarState,
					RUN_URL_KEY_BY_MODE[mode],
					cleanedUrl
				);
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
		activeRunId,
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
