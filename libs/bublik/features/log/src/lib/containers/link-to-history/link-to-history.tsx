/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC, useMemo } from 'react';
import { stringifySearch } from '@/router';
import { skipToken } from '@reduxjs/toolkit/dist/query';

import { buildQuery } from '@/shared/utils';
import {
	bublikAPI,
	useGetHistoryLinkDefaultsQuery,
	useGetRunDetailsQuery
} from '@/services/bublik-api';
import { useUserPreferences } from '@/bublik/features/user-preferences';

import { LinkToHistory } from '../../components';

export interface LinkToHistoryContainerProps {
	runId: string;
	focusId?: string | number | null;
}

export const LinkToHistoryContainer: FC<LinkToHistoryContainerProps> = ({
	runId,
	focusId
}) => {
	const { node } = bublikAPI.endpoints.getTreeByRunId.useQueryState(runId, {
		selectFromResult: (state) => ({
			node: !state.data || !focusId ? undefined : state.data.tree[focusId]
		})
	});
	const { userPreferences } = useUserPreferences();

	const isTest = node?.entity === 'test';
	const nodeId = node?.id;

	const { data, isFetching, isError } = useGetHistoryLinkDefaultsQuery(
		nodeId && isTest ? parseInt(nodeId) : skipToken
	);
	const { data: runDetails } = useGetRunDetailsQuery(runId);

	const to = useMemo(() => {
		if (!data || !runDetails) return '/history';

		const query = buildQuery({ result: data, runDetails });

		const search = new URLSearchParams(stringifySearch(query));
		search.set('mode', userPreferences.history.defaultMode);

		return `/history?${search.toString()}`;
	}, [data, runDetails, userPreferences.history.defaultMode]);

	return (
		<LinkToHistory to={to} isError={isError || !data} isLoading={isFetching} />
	);
};
