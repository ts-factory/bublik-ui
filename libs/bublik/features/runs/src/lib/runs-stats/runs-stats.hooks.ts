/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useMemo } from 'react';

import {
	RUN_STATUS,
	RunsChartsAPIQuery,
	RunsChartsAPIResponse
} from '@/shared/types';
import { useGetRunsChartsQuery } from '@/services/bublik-api';
import { parseTimeApi } from '@/shared/utils';

import { useRunsQuery } from '../hooks';
import { RunIdsByStatus, RunsChartBucket } from './runs-stats.types';
import {
	RunsChartPeriod,
	fillBuckets,
	getPassrate,
	makeEmptyRunIdsByStatus,
	parseBucketDate
} from './runs-stats.utils';

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
		date: parseBucketDate(date),
		tests: { ...tests, passrate: getPassrate(tests.ok, tests.total) },
		runIdsByStatus: toRunIdsByStatus(run_ids_by_status)
	}));

const parseRangeDate = (value?: string | null) =>
	value ? parseTimeApi(value) : undefined;

const toStats = (
	data: RunsChartsAPIResponse | undefined,
	period: RunsChartPeriod,
	range: { start?: Date; end?: Date }
) => (data ? fillBuckets(mapBuckets(data.buckets), period, range) : undefined);

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

	const range = useMemo(
		() => ({
			start: parseRangeDate(searchQuery.startDate),
			end: parseRangeDate(searchQuery.finishDate)
		}),
		[searchQuery.finishDate, searchQuery.startDate]
	);

	const dayQuery = useGetRunsChartsQuery({ ...chartsQuery, groupBy: 'day' });
	const weekQuery = useGetRunsChartsQuery({ ...chartsQuery, groupBy: 'week' });

	const dayStats = useMemo(
		() => toStats(dayQuery.data, 'day', range),
		[dayQuery.data, range]
	);

	const weekStats = useMemo(
		() => toStats(weekQuery.data, 'week', range),
		[weekQuery.data, range]
	);

	return {
		isLoading: dayQuery.isLoading || weekQuery.isLoading,
		isFetching: dayQuery.isFetching || weekQuery.isFetching,
		dayStats,
		weekStats,
		error: dayQuery.error || weekQuery.error
	} as const;
};
