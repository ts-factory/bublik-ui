/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useGetRunsStatsByRunIdsQuery } from '@/services/bublik-api';

import {
	RunsProgress,
	RunsProgressEmpty,
	RunsProgressError,
	RunsProgressLoading
} from './runs-progress.component';
import { useRunsProgressRuns } from './runs-progress.hooks';
import {
	buildFilterSummary,
	buildRunsProgressRows,
	filterRunsByDateWindow,
	getMetadataKeys,
	groupRuns,
	sortRunsNewestFirst
} from './runs-progress.utils';
import { useRunsQuery } from '../hooks';
import type { RunsProgressRun } from './runs-progress.types';

function RunsProgressContainer() {
	const [searchParams] = useSearchParams();
	const [groupKey, setGroupKey] = useState<string | null>(null);
	const [timeFrameDays, setTimeFrameDays] = useState<number | null>(null);
	const runsQuery = useRunsProgressRuns();
	const { query } = useRunsQuery();

	const windowedRuns = useMemo(
		() =>
			filterRunsByDateWindow(
				runsQuery.runs,
				query.startDate ?? '',
				query.finishDate ?? ''
			),
		[runsQuery.runs, query.startDate, query.finishDate]
	);

	const sortedRuns = useMemo(
		() => sortRunsNewestFirst(windowedRuns),
		[windowedRuns]
	);
	const statsParams = useMemo(
		() => sortedRuns.map((run) => ({ runId: run.id })),
		[sortedRuns]
	);
	const statsQuery = useGetRunsStatsByRunIdsQuery(statsParams, {
		skip: statsParams.length === 0
	});

	const progressRuns = useMemo(() => {
		const statsByRunId = new Map(
			(statsQuery.currentData?.runs ?? []).map((run) => [
				run.runId,
				run.results[0]
			])
		);

		return sortedRuns
			.map((run) => {
				const root = statsByRunId.get(run.id);

				return root ? { run, root } : null;
			})
			.filter((run): run is RunsProgressRun => run !== null);
	}, [sortedRuns, statsQuery.currentData?.runs]);

	const availableGroupKeys = useMemo(
		() => getMetadataKeys(sortedRuns),
		[sortedRuns]
	);
	const { orderedRuns, groups, timeGroups } = useMemo(
		() => groupRuns(progressRuns, { timeFrameDays, metaKey: groupKey }),
		[progressRuns, timeFrameDays, groupKey]
	);
	const rows = useMemo(() => buildRunsProgressRows(orderedRuns), [orderedRuns]);
	const filters = useMemo(
		() => buildFilterSummary(searchParams),
		[searchParams]
	);

	const statsPending = statsParams.length > 0 && !statsQuery.currentData;

	if (runsQuery.error || statsQuery.error) {
		return <RunsProgressError error={runsQuery.error || statsQuery.error} />;
	}

	if (runsQuery.isLoading || statsPending) return <RunsProgressLoading />;

	if (!progressRuns.length || !rows.length) return <RunsProgressEmpty />;

	return (
		<RunsProgress
			runs={orderedRuns}
			rows={rows}
			groups={groups}
			timeGroups={timeGroups}
			groupKey={groupKey}
			timeFrameDays={timeFrameDays}
			onTimeFrameDaysChange={setTimeFrameDays}
			availableGroupKeys={availableGroupKeys}
			onGroupKeyChange={setGroupKey}
			filters={filters}
			isFetching={runsQuery.isFetching || statsQuery.isFetching}
			isCapped={runsQuery.isCapped}
			total={runsQuery.total}
			cap={runsQuery.cap}
		/>
	);
}

export { RunsProgressContainer };
