/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
	ISSUES_MODE_DEFAULT,
	ISSUES_SIDEBAR_KEYS,
	IssuesMode,
	getSidebarStateString,
	setSidebarStateValue,
	stripSidebarParamsFromUrl,
	useSidebarStateWriter
} from '@/bublik/features/sidebar';

const ISSUES_MODES: readonly IssuesMode[] = ['issues', 'rules'];

export interface UseIssuesSidebarStateReturn {
	lastListUrl: string | null;
	lastRulesUrl: string | null;
	lastMode: IssuesMode | null;

	listUrl: string;
	rulesUrl: string;
	mainLinkUrl: string;

	setLastVisited: (mode: IssuesMode, url: string) => void;
}

export function useIssuesSidebarState(): UseIssuesSidebarStateReturn {
	const [searchParams] = useSearchParams();
	const writeSidebarState = useSidebarStateWriter();

	const lastListUrl = useMemo(
		() => getSidebarStateString(searchParams, ISSUES_SIDEBAR_KEYS.LAST_LIST),
		[searchParams]
	);
	const lastRulesUrl = useMemo(
		() => getSidebarStateString(searchParams, ISSUES_SIDEBAR_KEYS.LAST_RULES),
		[searchParams]
	);

	const lastMode = useMemo<IssuesMode | null>(() => {
		const mode = getSidebarStateString(
			searchParams,
			ISSUES_SIDEBAR_KEYS.LAST_MODE
		);

		if (mode && ISSUES_MODES.includes(mode as IssuesMode)) {
			return mode as IssuesMode;
		}

		return null;
	}, [searchParams]);

	const listUrl = lastListUrl || '/issues';
	const rulesUrl = lastRulesUrl || '/issues/rules';

	const mainLinkUrl = useMemo(() => {
		// `lastMode` is omitted from `_s` when it equals the shared default.
		switch (lastMode ?? ISSUES_MODE_DEFAULT) {
			case 'rules':
				return rulesUrl;
			case 'issues':
			default:
				return listUrl;
		}
	}, [lastMode, listUrl, rulesUrl]);

	const setLastVisited = useCallback(
		(mode: IssuesMode, url: string) => {
			const cleanedUrl = stripSidebarParamsFromUrl(url);

			writeSidebarState((sidebarState) => {
				setSidebarStateValue(sidebarState, ISSUES_SIDEBAR_KEYS.LAST_MODE, mode);

				setSidebarStateValue(
					sidebarState,
					mode === 'rules'
						? ISSUES_SIDEBAR_KEYS.LAST_RULES
						: ISSUES_SIDEBAR_KEYS.LAST_LIST,
					cleanedUrl
				);
			});
		},
		[writeSidebarState]
	);

	return {
		lastListUrl,
		lastRulesUrl,
		lastMode,
		listUrl,
		rulesUrl,
		mainLinkUrl,
		setLastVisited
	};
}
