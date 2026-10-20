/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */

import { useCallback, useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { skipToken } from '@reduxjs/toolkit/query';

import { useGetIssueQuery } from '@/services/bublik-api';
import {
	ISSUE_MODE_DEFAULT,
	ISSUE_SIDEBAR_KEYS,
	IssueMode,
	extractIssueIdFromUrl,
	getIssueDefaultUrl,
	getIssueResultsDefaultUrl,
	getSidebarStateString,
	setSidebarStateValue,
	stripSidebarParamsFromUrl,
	useSidebarStateWriter
} from '@/bublik/features/sidebar';

const ISSUE_MODES: readonly IssueMode[] = ['rules', 'results'];

const ISSUE_URL_KEY_BY_MODE: Record<IssueMode, string> = {
	rules: ISSUE_SIDEBAR_KEYS.LAST_ISSUE,
	results: ISSUE_SIDEBAR_KEYS.LAST_RESULTS
};

export interface UseIssueSidebarStateReturn {
	/** The issue the submenu is about: the one on screen, else the last visited. */
	activeIssueId: string | null;
	lastRulesUrl: string | null;
	lastResultsUrl: string | null;
	lastMode: IssueMode | null;

	rulesUrl: string;
	resultsUrl: string;
	mainLinkUrl: string;

	isAvailable: boolean;
	isResultsAvailable: boolean;
	isResultsLoading: boolean;

	/** The active issue's rules, active or not; 0 until it has loaded. */
	ruleCount: number;
	/** Stamps under the active issue, across every run; 0 until it has loaded. */
	resultCount: number;

	/** The active issue's tracker key; null until it has loaded. */
	bugKey: string | null;
	issueTitle: string;
	isIssueClosed: boolean;

	setLastVisited: (mode: IssueMode, url: string) => void;
}

export function useIssueSidebarState(): UseIssueSidebarStateReturn {
	const location = useLocation();
	const [searchParams] = useSearchParams();
	const writeSidebarState = useSidebarStateWriter();

	const storedRulesUrl = useMemo(
		() => getSidebarStateString(searchParams, ISSUE_SIDEBAR_KEYS.LAST_ISSUE),
		[searchParams]
	);
	const storedResultsUrl = useMemo(
		() => getSidebarStateString(searchParams, ISSUE_SIDEBAR_KEYS.LAST_RESULTS),
		[searchParams]
	);

	const lastMode = useMemo<IssueMode | null>(() => {
		const mode = getSidebarStateString(
			searchParams,
			ISSUE_SIDEBAR_KEYS.LAST_MODE
		);

		return mode && ISSUE_MODES.includes(mode as IssueMode)
			? (mode as IssueMode)
			: null;
	}, [searchParams]);

	const activeIssueId = useMemo(
		() =>
			extractIssueIdFromUrl(location.pathname) ??
			(storedRulesUrl && extractIssueIdFromUrl(storedRulesUrl)) ??
			(storedResultsUrl && extractIssueIdFromUrl(storedResultsUrl)) ??
			null,
		[location.pathname, storedRulesUrl, storedResultsUrl]
	);

	// A URL remembered for another issue is no use for this one.
	const scopeToActiveIssue = useCallback(
		(url: string | null) =>
			url && activeIssueId && extractIssueIdFromUrl(url) === activeIssueId
				? url
				: null,
		[activeIssueId]
	);

	const lastRulesUrl = useMemo(
		() => scopeToActiveIssue(storedRulesUrl),
		[scopeToActiveIssue, storedRulesUrl]
	);
	const lastResultsUrl = useMemo(
		() => scopeToActiveIssue(storedResultsUrl),
		[scopeToActiveIssue, storedResultsUrl]
	);

	// Same args the issue page uses, so both share one cache entry.
	const { data: issue, isLoading: isResultsLoading } = useGetIssueQuery(
		activeIssueId ? { issueId: Number(activeIssueId) } : skipToken
	);

	// Results has nothing to show for an issue with no stamps, so it stays
	// disabled until we know there is at least one. While the count is in
	// flight we trust a previous visit to *this* issue's results, or being on
	// that page already, rather than flashing a link to an empty page.
	const isOnResultsPage =
		!!activeIssueId &&
		location.pathname === getIssueResultsDefaultUrl(activeIssueId);
	const isResultsAvailable =
		!!activeIssueId &&
		(isResultsLoading || !issue
			? !!lastResultsUrl || isOnResultsPage
			: issue.result_count > 0);

	const rulesUrl = useMemo(() => {
		if (lastRulesUrl) return lastRulesUrl;
		if (activeIssueId) return getIssueDefaultUrl(activeIssueId);
		return '/issues';
	}, [lastRulesUrl, activeIssueId]);

	const resultsUrl = useMemo(() => {
		if (lastResultsUrl) return lastResultsUrl;
		if (activeIssueId) return getIssueResultsDefaultUrl(activeIssueId);
		return '/issues';
	}, [lastResultsUrl, activeIssueId]);

	const mainLinkUrl = useMemo(() => {
		// An issue that lost (or never had) results must not strand the Issue
		// link on a page with nothing on it.
		if ((lastMode ?? ISSUE_MODE_DEFAULT) === 'results' && isResultsAvailable) {
			return resultsUrl;
		}

		return rulesUrl;
	}, [lastMode, isResultsAvailable, resultsUrl, rulesUrl]);

	const setLastVisited = useCallback(
		(mode: IssueMode, url: string) => {
			const cleanedUrl = stripSidebarParamsFromUrl(url);
			const issueId = extractIssueIdFromUrl(cleanedUrl);

			writeSidebarState((sidebarState) => {
				setSidebarStateValue(sidebarState, ISSUE_SIDEBAR_KEYS.LAST_MODE, mode);

				// Moving to another issue invalidates the URL remembered for the
				// previous one's other page. The read side scopes it away
				// regardless; dropping it keeps it from eating the `_s` budget.
				ISSUE_MODES.filter((other) => other !== mode).forEach((other) => {
					const key = ISSUE_URL_KEY_BY_MODE[other];
					const otherUrl = sidebarState[key];

					if (
						typeof otherUrl === 'string' &&
						extractIssueIdFromUrl(otherUrl) !== issueId
					) {
						setSidebarStateValue(sidebarState, key, null);
					}
				});

				setSidebarStateValue(
					sidebarState,
					ISSUE_URL_KEY_BY_MODE[mode],
					cleanedUrl
				);
			});
		},
		[writeSidebarState]
	);

	return {
		activeIssueId,
		lastRulesUrl,
		lastResultsUrl,
		lastMode,
		rulesUrl,
		resultsUrl,
		mainLinkUrl,
		isAvailable: !!activeIssueId,
		isResultsAvailable,
		isResultsLoading,
		ruleCount: issue?.rule_count ?? 0,
		resultCount: issue?.result_count ?? 0,
		bugKey: issue?.bug_key ?? null,
		issueTitle: issue?.title ?? '',
		isIssueClosed: issue?.state === 'closed',
		setLastVisited
	};
}
