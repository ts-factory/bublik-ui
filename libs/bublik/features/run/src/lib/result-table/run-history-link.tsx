/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { skipToken } from '@reduxjs/toolkit/query';

import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import { LinkWithProject } from '@/bublik/features/projects';
import { useGetRunDetailsQuery } from '@/services/bublik-api';
import {
	ButtonTw,
	Icon,
	TOOLBAR_BUTTON_CLASS,
	TOOLBAR_ICON_CLASS,
	TOOLBAR_LABEL_CLASS,
	Tooltip
} from '@/shared/tailwind-ui';
import {
	HistorySearchBuilder,
	historySearch,
	type HistoryRouteSearch
} from '@/shared/utils';

/**
 * The `/history` search of the test's results in these runs: the
 * builder's wire strings, read as the history route reads them, so its
 * codecs write the same bytes back (`runIds` `;`-joined).
 */
export function getHistoryViewSearch(
	path: string[],
	runIds: number[],
	maybeDate?: string
): HistoryRouteSearch {
	const query = new HistorySearchBuilder(path.join('/')).withRunIds(runIds);
	if (maybeDate) query.withAnchorDate(maybeDate);

	return historySearch.validateSearch(query.build());
}

export interface RunHistoryLinkProps {
	runIds: number[];
	path: string[];
}

/**
 * Opens the history view of the test's results in the run, anchored at the
 * run's finish date. Sits at the end of the result table's filter bar.
 */
export function RunHistoryLink({ runIds, path }: RunHistoryLinkProps) {
	const { data } = useGetRunDetailsQuery(runIds[0] ?? skipToken);
	const historySearchOfRuns = getHistoryViewSearch(path, runIds, data?.finish);

	return (
		<Tooltip content="History view of results in the run">
			<ButtonTw
				variant="secondary"
				size="xss"
				className={TOOLBAR_BUTTON_CLASS}
				asChild
			>
				<LinkWithProject
					to="/history"
					search={historySearchOfRuns}
					data-testid="result-table-history-link"
					aria-label="History"
					onClick={() =>
						trackEvent(analyticsEventNames.runTableHistoryLinkClick, {
							action: 'open_history_view',
							runCount: runIds.length
						})
					}
				>
					<Icon name="BoxArrowRight" size={20} className={TOOLBAR_ICON_CLASS} />
					<span className={TOOLBAR_LABEL_CLASS}>History</span>
				</LinkWithProject>
			</ButtonTw>
		</Tooltip>
	);
}
