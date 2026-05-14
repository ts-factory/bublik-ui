/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useMemo } from 'react';

import {
	RUN_STATUS,
	RunsChartsAPIQuery,
	RunsChartsAPIResponse
} from '@/shared/types';
import { useGetRunsChartsQuery } from '@/services/bublik-api';

import { useRunsQuery } from '../hooks';
import { RunIdsByStatus, RunsChartBucket } from './runs-stats.types';

const makeEmptyRunIdsByStatus = (): RunIdsByStatus => ({
	[RUN_STATUS.Busy]: [],
	[RUN_STATUS.Compromised]: [],
	[RUN_STATUS.Error]: [],
	[RUN_STATUS.Interrupted]: [],
	[RUN_STATUS.Ok]: [],
	[RUN_STATUS.Running]: [],
	[RUN_STATUS.Stopped]: [],
	[RUN_STATUS.Warning]: []
});

const toRunIdsByStatus = (
	runIdsByStatus: Partial<Record<RUN_STATUS, number[]>>
): RunIdsByStatus => {
	const result = makeEmptyRunIdsByStatus();

	Object.values(RUN_STATUS).forEach((status) => {
		result[status] = runIdsByStatus[status]?.map(String) ?? [];
	});

	return result;
};

const mapBuckets = (
	buckets: RunsChartsAPIResponse['buckets']
): RunsChartBucket[] =>
	buckets.map(({ date, tests, run_ids_by_status }) => ({
		date: new Date(date),
		tests,
		runIdsByStatus: toRunIdsByStatus(run_ids_by_status)
	}));

export const useRunsStats = () => {
	const { query: searchQuery } = useRunsQuery();

	const chartsQuery = useMemo<RunsChartsAPIQuery>(
		() => ({
			startDate: searchQuery.startDate,
			finishDate: searchQuery.finishDate,
			runData: searchQuery.runData,
			tagExpr: searchQuery.tagExpr,
			projects: searchQuery.projects
		}),
		[
			searchQuery.finishDate,
			searchQuery.projects,
			searchQuery.runData,
			searchQuery.startDate,
			searchQuery.tagExpr
		]
	);

	const dayQuery = useGetRunsChartsQuery({ ...chartsQuery, groupBy: 'day' });
	const weekQuery = useGetRunsChartsQuery({ ...chartsQuery, groupBy: 'week' });

	const dayStats = useMemo(() => {
		if (!dayQuery.data) return undefined;

		return mapBuckets(dayQuery.data.buckets);
	}, [dayQuery.data]);

	const weekStats = useMemo(() => {
		if (!weekQuery.data) return undefined;

		return mapBuckets(weekQuery.data.buckets);
	}, [weekQuery.data]);

	return {
		isLoading: dayQuery.isLoading || weekQuery.isLoading,
		isFetching: dayQuery.isFetching || weekQuery.isFetching,
		dayStats,
		weekStats,
		error: dayQuery.error || weekQuery.error
	} as const;
};
