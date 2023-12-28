/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import {
	useGetHistoryAggregationQuery,
	useGetHistoryLinearQuery
} from '@/services/bublik-api';

import {
	HistoryLegendCount,
	HistoryLegendCountLoading
} from './history-legend-count.component';
import { useHistoryQuery } from '../hooks';

export const HistoryLegendCountContainer = () => {
	const [searchParams] = useSearchParams();
	const { query } = useHistoryQuery();
	const mode = searchParams.get('mode');
	const state = useLocation().state as { fromRun?: boolean };

	const shouldLinearSkip =
		mode === 'aggregation' || state?.fromRun || !query.testName;
	const shouldAggregationSkip =
		mode !== 'aggregation' || state?.fromRun || !query.testName;

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
