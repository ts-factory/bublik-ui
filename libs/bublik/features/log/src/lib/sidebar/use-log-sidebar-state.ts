/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

import { useCallback } from 'react';

import {
	LOG_SIDEBAR_KEYS,
	LogSidebarMode,
	RUN_SIDEBAR_KEYS,
	SHARED_SIDEBAR_KEYS,
	setSidebarStateValue,
	stripSidebarParamsFromUrl,
	useSidebarStateWriter,
	extractRunIdFromLogUrl
} from '@/bublik/features/sidebar';

/** The run URLs that go stale the moment another run is opened. */
const RUN_URL_KEYS = [
	RUN_SIDEBAR_KEYS.LAST_DETAILS,
	RUN_SIDEBAR_KEYS.LAST_REPORT,
	RUN_SIDEBAR_KEYS.LAST_ISSUES
];

export interface UseLogSidebarStateReturn {
	/** Records the log page as the run's last page, in the given layout. */
	setLastVisited: (mode: LogSidebarMode, url: string, runId?: string) => void;
}

/**
 * The log page's writer. The sidebar reads the log keys through the Run
 * entry's hook (`useRunSidebarState`), which scopes them to the run in view;
 * this side only records. It also moves the Run link to the log in the same
 * commit -- a second writer for that key would clobber this one's `_s`.
 */
export function useLogSidebarState(): UseLogSidebarStateReturn {
	const writeSidebarState = useSidebarStateWriter();

	const setLastVisited = useCallback(
		(mode: LogSidebarMode, url: string, runId?: string) => {
			const cleanedUrl = stripSidebarParamsFromUrl(url);
			const extractedRunId = runId || extractRunIdFromLogUrl(cleanedUrl);

			writeSidebarState((sidebarState) => {
				setSidebarStateValue(sidebarState, LOG_SIDEBAR_KEYS.LAST_MODE, mode);
				setSidebarStateValue(sidebarState, RUN_SIDEBAR_KEYS.LAST_MODE, 'log');

				if (extractedRunId) {
					// Same as the run pages: another run's remembered URLs only eat
					// the `_s` budget, the read side scopes them away regardless.
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

				setSidebarStateValue(
					sidebarState,
					LOG_SIDEBAR_KEYS.LAST_LOG,
					cleanedUrl
				);
			});
		},
		[writeSidebarState]
	);

	return { setLastVisited };
}
