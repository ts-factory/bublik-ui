/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useMemo } from 'react';

import { RunsAPIQuery, RunsData } from '@/shared/types';
import { useGetRunsTablePageQuery } from '@/services/bublik-api';

import { useRunsQuery } from '../hooks';

const SAFETY_CAP = 200;

type RunsProgressRunsResult = {
	runs: RunsData[];
	total: number;
	cap: number;
	isCapped: boolean;
	isLoading: boolean;
	isFetching: boolean;
	error: unknown;
};

function useRunsProgressRuns(): RunsProgressRunsResult {
	const { query } = useRunsQuery();
	const hasDateBoundary = Boolean(query.startDate) || Boolean(query.finishDate);

	const baseQuery = useMemo<RunsAPIQuery>(
		() => ({
			startDate: query.startDate,
			finishDate: query.finishDate,
			runData: query.runData,
			tagExpr: query.tagExpr,
			projects: query.projects
		}),
		[
			query.startDate,
			query.finishDate,
			query.runData,
			query.tagExpr,
			query.projects
		]
	);

	const probeQuery = useGetRunsTablePageQuery(
		{ ...baseQuery, page: '1', pageSize: '1' },
		{ refetchOnFocus: true, refetchOnMountOrArgChange: true }
	);

	const total = probeQuery.currentData?.pagination.count ?? 0;
	const isCapped = !hasDateBoundary && total > SAFETY_CAP;
	const effectiveSize = hasDateBoundary ? total : Math.min(total, SAFETY_CAP);

	const fullQuery = useGetRunsTablePageQuery(
		{ ...baseQuery, page: '1', pageSize: effectiveSize.toString() },
		{
			skip: effectiveSize === 0,
			refetchOnFocus: true,
			refetchOnMountOrArgChange: true
		}
	);

	const runs = fullQuery.currentData?.results ?? [];
	const isLoading =
		!probeQuery.currentData || (effectiveSize > 0 && !fullQuery.currentData);
	const isFetching = probeQuery.isFetching || fullQuery.isFetching;

	return {
		runs,
		total,
		cap: SAFETY_CAP,
		isCapped,
		isLoading,
		isFetching,
		error: probeQuery.error || fullQuery.error
	};
}

export { useRunsProgressRuns };
