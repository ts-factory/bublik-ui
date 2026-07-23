/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useEffect, useMemo, useRef, useState } from 'react';

import { RunData, RunsAPIQuery, RunsData } from '@/shared/types';
import {
	useGetRunsProgressInfiniteQuery,
	useLazyGetRunsStatsByRunIdsQuery
} from '@/services/bublik-api';

import { useRunsQuery } from '../hooks';

type RunsProgressRunsResult = {
	runs: RunsData[];
	total: number;
	isLoading: boolean;
	isFetching: boolean;
	isFetchingNextPage: boolean;
	hasNextPage: boolean;
	fetchNextPage: () => void;
	error: unknown;
};

type RunsProgressStatsResult = {
	statsByRunId: Map<number, RunData>;
	isLoading: boolean;
	isFetching: boolean;
	error: unknown;
};

function useRunsProgressRuns(): RunsProgressRunsResult {
	const { query } = useRunsQuery();
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
	const runsQuery = useGetRunsProgressInfiniteQuery(baseQuery, {
		refetchOnFocus: true,
		refetchOnMountOrArgChange: true
	});
	const runs = useMemo(
		() => runsQuery.currentData?.pages.flatMap((page) => page.results) ?? [],
		[runsQuery.currentData?.pages]
	);

	return {
		runs,
		total: runsQuery.currentData?.pages[0]?.pagination.count ?? 0,
		isLoading: runsQuery.isLoading,
		isFetching: runsQuery.isFetching,
		isFetchingNextPage: runsQuery.isFetchingNextPage,
		hasNextPage: runsQuery.hasNextPage,
		fetchNextPage: () => {
			void runsQuery.fetchNextPage();
		},
		error: runsQuery.error
	};
}

function useRunsProgressStats(runs: RunsData[]): RunsProgressStatsResult {
	const [fetchStats, statsQuery] = useLazyGetRunsStatsByRunIdsQuery();
	const [statsByRunId, setStatsByRunId] = useState<Map<number, RunData>>(
		() => new Map()
	);
	const requestedRunIdsRef = useRef(new Set<number>());

	useEffect(() => {
		const missingRuns = runs.filter(
			(run) => !requestedRunIdsRef.current.has(run.id)
		);

		if (!missingRuns.length) return;

		missingRuns.forEach((run) => requestedRunIdsRef.current.add(run.id));
		const request = fetchStats(missingRuns.map((run) => ({ runId: run.id })));

		void request
			.unwrap()
			.then((response) => {
				setStatsByRunId((current) => {
					const next = new Map(current);

					response.runs.forEach((run) => {
						const root = run.results[0];
						if (root) next.set(run.runId, root);
					});

					return next;
				});
			})
			.catch(() => {
				missingRuns.forEach((run) => requestedRunIdsRef.current.delete(run.id));
			});
	}, [fetchStats, runs]);

	const isLoading = runs.some((run) => !statsByRunId.has(run.id));

	return {
		statsByRunId,
		isLoading,
		isFetching: statsQuery.isFetching,
		error: statsQuery.error
	};
}

export { useRunsProgressRuns, useRunsProgressStats };
