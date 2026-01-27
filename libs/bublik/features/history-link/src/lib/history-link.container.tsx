/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useMemo } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';

import { HistoryMode, RunDataResults } from '@/shared/types';
import { getHistorySearch } from '@/shared/utils';
import {
	useGetResultInfoQuery,
	useGetRunDetailsQuery
} from '@/services/bublik-api';
import { useUserPreferences } from '@/bublik/features/user-preferences';

import { HistoryLinkComponent } from './history-link.component';

type HistoryLinkContainerPropsCommon = {
	runId: number;
	userPreferredHistoryMode?: HistoryMode;
	disabled?: boolean;
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
	const detailsQuery = useGetRunDetailsQuery(runId);

	const historyMode =
		userPreferredHistoryMode ?? userPreferences.history.defaultMode;

	const resultData = result ?? resultQuery.data;

	const search = useMemo(() => {
		if (!resultData || !detailsQuery.data) return null;

		return getHistorySearch(detailsQuery.data, resultData, historyMode);
	}, [resultData, detailsQuery.data, historyMode]);

	const isLoading = detailsQuery.isLoading || resultQuery.isFetching;
	const isError = resultQuery.isError || detailsQuery.isError;
	const disabled = propsDisabled || Boolean(!resultData || isError);

	return (
		<HistoryLinkComponent
			search={search}
			isLoading={isLoading}
			isError={isError}
			disabled={disabled}
		/>
	);
}

export { HistoryLinkContainer };
