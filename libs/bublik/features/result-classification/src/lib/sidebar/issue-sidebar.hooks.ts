/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
	ISSUE_SIDEBAR_KEYS,
	getSidebarStateString,
	setSidebarStateValue,
	stripSidebarParamsFromUrl,
	useSidebarStateWriter
} from '@/bublik/features/sidebar';

export interface UseIssueSidebarStateReturn {
	lastIssueUrl: string | null;
	/** Falls back to the issues list so the link is never a dead end. */
	mainLinkUrl: string;
	/** No issue has been opened yet, so there is nothing to go back to. */
	isAvailable: boolean;
	setLastVisited: (url: string) => void;
}

export function useIssueSidebarState(): UseIssueSidebarStateReturn {
	const [searchParams] = useSearchParams();
	const writeSidebarState = useSidebarStateWriter();

	const lastIssueUrl = useMemo(
		() => getSidebarStateString(searchParams, ISSUE_SIDEBAR_KEYS.LAST_ISSUE),
		[searchParams]
	);

	const setLastVisited = useCallback(
		(url: string) => {
			const cleanedUrl = stripSidebarParamsFromUrl(url);

			writeSidebarState((sidebarState) => {
				setSidebarStateValue(
					sidebarState,
					ISSUE_SIDEBAR_KEYS.LAST_ISSUE,
					cleanedUrl
				);
			});
		},
		[writeSidebarState]
	);

	return {
		lastIssueUrl,
		mainLinkUrl: lastIssueUrl || '/issues',
		isAvailable: !!lastIssueUrl,
		setLastVisited
	};
}
