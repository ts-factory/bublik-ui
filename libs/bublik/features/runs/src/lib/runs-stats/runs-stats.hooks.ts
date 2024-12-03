/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useMemo } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';

import { RUN_STATUS, RunsAPIQuery } from '@/shared/types';
import { useGetRunsTablePageQuery } from '@/services/bublik-api';

import { useRunsQuery } from '../hooks';

export const useRunsStats = () => {
	const { query: searchQuery } = useRunsQuery();

	const query = useGetRunsTablePageQuery(searchQuery);

	const calculatedQuery: RunsAPIQuery | typeof skipToken = query.data
		? {
				...searchQuery,
				page: '1',
				pageSize: String(query.data.pagination.count)
			}
		: skipToken;

	const finalQuery = useGetRunsTablePageQuery(calculatedQuery);

	const data = useMemo(() => {
		if (!finalQuery.data) return undefined;

		return finalQuery.data.results.map(({ stats, start, conclusion, id }) => {
			return {
				runId: String(id),
				runStatus: conclusion as RUN_STATUS,
				total: stats.tests_total,
				nok: stats.tests_total_nok,
				nokPercent: stats.tests_total_nok_percent,
				ok: stats.tests_total_ok,
				okPercent: stats.tests_total_ok_percent,
				planPercent: stats.tests_total_plan_percent,
				passrate: Number(
					((stats.tests_total_ok / stats.tests_total) * 100).toFixed(2)
				),
				date: new Date(start)
			};
		});
	}, [finalQuery.data]);

	return {
		isLoading: query.isLoading || finalQuery.isLoading,
		isFetching: query.isFetching || finalQuery.isFetching,
		stats: data,
		queryData: finalQuery.data,
		error: query.error || finalQuery.error
	} as const;
};
