/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { cn } from '@/shared/tailwind-ui';

import { useRunsChartPeriod, useRunsStats } from './runs-stats.hooks';
import {
	RunsStats,
	RunsStatsEmpty,
	RunsStatsError,
	RunsStatsLoading
} from './runs-stats.component';

export const RunsStatsContainer = () => {
	const { stats, period, isLoading, error, isFetching } = useRunsStats();
	const [, setPeriod] = useRunsChartPeriod();

	if (error) return <RunsStatsError error={error} />;

	if (isLoading) return <RunsStatsLoading />;

	if (!stats?.length) return <RunsStatsEmpty />;

	return (
		<div className={cn(isFetching && 'opacity-40 pointer-events-none')}>
			<RunsStats stats={stats} period={period} onPeriodChange={setPeriod} />
		</div>
	);
};
