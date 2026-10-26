/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useMemo } from 'react';
import { useQueryParam } from 'use-query-params';

import {
	RUN_STATUS,
	RunsChartsAPIQuery,
	RunsChartsAPIResponse
} from '@/shared/types';
import { useGetRunsChartsQuery } from '@/services/bublik-api';
import { parseTimeApi } from '@/shared/utils';

import { useRunsQuery } from '../hooks';
import { RunIdsByStatus, RunsChartBucket } from './runs-stats.types';
import { PeriodParam } from './runs-stats.params';
import {
	RunsChartPeriod,
	fillBuckets,
	getPassrate,
	groupBuckets,
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
) =>
	data
		? fillBuckets(groupBuckets(mapBuckets(data.buckets), period), period, range)
		: undefined;

export const useRunsChartPeriod = () => useQueryParam('period', PeriodParam);

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

	const [period] = useRunsChartPeriod();
	// Weeks and months are summed up from days, so one request serves them all
	const dayQuery = useGetRunsChartsQuery({ ...chartsQuery, groupBy: 'day' });

	const stats = useMemo(
		() => toStats(dayQuery.data, period, range),
		[dayQuery.data, period, range]
	);

	return {
		isLoading: dayQuery.isLoading,
		isFetching: dayQuery.isFetching,
		stats,
		period,
		error: dayQuery.error
	} as const;
};
