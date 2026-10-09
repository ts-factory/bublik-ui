/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useMemo } from 'react';

import {
	useGetHistoryAggregationQuery,
	useGetHistoryLinearQuery
} from '@/services/bublik-api';

import {
	HistoryLegendCount,
	HistoryLegendCountLoading
} from './history-legend-count.component';
import { useHistoryFromRun, useHistoryQuery, useHistorySearch } from '../hooks';

export const HistoryLegendCountContainer = () => {
	const { query } = useHistoryQuery();
	const mode = useHistorySearch((search) => search.mode);
	const fromRun = useHistoryFromRun();

	const shouldLinearSkip = mode === 'aggregation' || fromRun || !query.testName;
	const shouldAggregationSkip =
		mode !== 'aggregation' || fromRun || !query.testName;

	const { data: linearData, isLoading: isLinearLoading } =
		useGetHistoryLinearQuery(query, {
			selectFromResult: ({ data, isFetching }) => ({
				data: data?.counts,
				isLoading: isFetching
			}),
			skip: shouldLinearSkip
		});

	const { data: aggregationData, isLoading: isAggregationLoading } =
		useGetHistoryAggregationQuery(query, {
			selectFromResult: ({ data, isFetching }) => ({
				data: data?.counts,
				isLoading: isFetching
			}),
			skip: shouldAggregationSkip
		});

	const counts = useMemo(() => {
		if (mode === 'linear' && linearData) return linearData;
		if (mode === 'aggregation' && aggregationData) return aggregationData;

		return linearData;
	}, [aggregationData, linearData, mode]);

	if (isLinearLoading || isAggregationLoading) {
		return <HistoryLegendCountLoading />;
	}

	return (
		<HistoryLegendCount
			runs={counts?.runs}
			iterations={counts?.iterations}
			results={counts?.total_results}
			expected={counts?.expected_results}
			unexpected={counts?.unexpected_results}
		/>
	);
};
