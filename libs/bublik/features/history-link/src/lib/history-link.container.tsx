/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useMemo } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';

import {
	HistoryMode,
	RunDataResults,
	RunDetailsAPIResponse
} from '@/shared/types';
import { getHistorySearch } from '@/shared/utils';
import {
	useGetResultInfoQuery,
	useGetRunDetailsQuery
} from '@/services/bublik-api';
import { useUserPreferences } from '@/bublik/features/user-preferences';

import {
	HistoryLinkComponent,
	HistoryLinkIssue
} from './history-link.component';

type HistoryLinkContainerPropsCommon = {
	runId: number;
	userPreferredHistoryMode?: HistoryMode;
	disabled?: boolean;
	path?: string;
	/** Adds a submenu per issue that narrows the history to it. */
	issues?: HistoryLinkIssue[];
	/**
	 * The run's tags, when the caller already has them: all the links need
	 * of the run's details, which are then not fetched. Rows that span runs
	 * carry them, so a page of them costs no request per run.
	 */
	runTags?: Pick<RunDetailsAPIResponse, 'important_tags' | 'relevant_tags'>;
};

export type HistoryLinkContainerProps =
	| (HistoryLinkContainerPropsCommon & {
			result: RunDataResults;
			resultId?: never;
	  })
	| (HistoryLinkContainerPropsCommon & { resultId?: number; result?: never });

function HistoryLinkContainer(props: HistoryLinkContainerProps) {
	const { runId, userPreferredHistoryMode, disabled: propsDisabled } = props;
	const { userPreferences } = useUserPreferences();

	const resultId = 'resultId' in props ? props.resultId : undefined;
	const result = 'result' in props ? props.result : undefined;

	const resultQuery = useGetResultInfoQuery(resultId ?? skipToken);
	const detailsQuery = useGetRunDetailsQuery(props.runTags ? skipToken : runId);

	const historyMode =
		userPreferredHistoryMode ?? userPreferences.history.defaultMode;

	const resultData = result ?? resultQuery.data;
	const runTags = props.runTags ?? detailsQuery.data;

	const search = useMemo(() => {
		if (!resultData || !runTags) return null;

		return getHistorySearch(runTags, resultData, historyMode, props.path);
	}, [resultData, runTags, historyMode, props.path]);

	const isLoading = detailsQuery.isLoading || resultQuery.isFetching;
	const isError = resultQuery.isError || detailsQuery.isError;
	const disabled = propsDisabled || Boolean(!resultData || isError);

	return (
		<HistoryLinkComponent
			search={search}
			issues={props.issues}
			isLoading={isLoading}
			isError={isError}
			disabled={disabled}
		/>
	);
}

export { HistoryLinkContainer };
