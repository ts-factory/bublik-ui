/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
	RunsProgress,
	RunsProgressEmpty,
	RunsProgressError,
	RunsProgressLoading
} from './runs-progress.component';
import {
	useRunsProgressRuns,
	useRunsProgressStats
} from './runs-progress.hooks';
import {
	buildFilterSummary,
	buildPackageSummaries,
	buildRunsProgressRows,
	filterRunsByDateWindow,
	getMetadataKeys,
	getRunPackageName,
	groupRuns,
	sortRunsNewestFirst
} from './runs-progress.utils';
import { useRunsQuery } from '../hooks';
import type { RunsProgressRun } from './runs-progress.types';

function RunsProgressContainer() {
	const [searchParams] = useSearchParams();
	const [groupKey, setGroupKey] = useState<string | null>(null);
	const [timeFrameDays, setTimeFrameDays] = useState<number | null>(null);
	const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
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
	const statsQuery = useRunsProgressStats(sortedRuns);

	const progressRuns = useMemo(() => {
		return sortedRuns
			.map((run) => {
				const root = statsQuery.statsByRunId.get(run.id);

				return root ? { run, root } : null;
			})
			.filter((run): run is RunsProgressRun => run !== null);
	}, [sortedRuns, statsQuery.statsByRunId]);

	const availableGroupKeys = useMemo(
		() => getMetadataKeys(sortedRuns),
		[sortedRuns]
	);

	const packages = useMemo(
		() => buildPackageSummaries(progressRuns),
		[progressRuns]
	);
	const effectivePackage =
		selectedPackage && packages.some((pkg) => pkg.name === selectedPackage)
			? selectedPackage
			: packages[0]?.name ?? null;
	const focusedRuns = useMemo(
		() =>
			effectivePackage
				? progressRuns.filter(
						(run) => getRunPackageName(run.root) === effectivePackage
				  )
				: progressRuns,
		[progressRuns, effectivePackage]
	);

	const { orderedRuns, groups, timeGroups } = useMemo(
		() => groupRuns(focusedRuns, { timeFrameDays, metaKey: groupKey }),
		[focusedRuns, timeFrameDays, groupKey]
	);
	const rows = useMemo(() => buildRunsProgressRows(orderedRuns), [orderedRuns]);
	const filters = useMemo(
		() => buildFilterSummary(searchParams),
		[searchParams]
	);

	const statsPending = sortedRuns.length > 0 && !progressRuns.length;

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
			packages={packages}
			selectedPackage={effectivePackage}
			onSelectedPackageChange={setSelectedPackage}
			filters={filters}
			isFetching={runsQuery.isFetching && !runsQuery.isFetchingNextPage}
			isLoadingMore={runsQuery.isFetchingNextPage || statsQuery.isFetching}
			hasNextPage={runsQuery.hasNextPage}
			onLoadMore={runsQuery.fetchNextPage}
			loaded={runsQuery.runs.length}
			total={runsQuery.total}
		/>
	);
}

export { RunsProgressContainer };
