/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { CardHeader, Skeleton } from '@/shared/tailwind-ui';
import { BublikEmptyState, BublikErrorState } from '@/bublik/features/ui-state';

import {
	ConclusionSection,
	PERIOD_LABELS,
	PeriodToggle,
	TestsSection
} from './components';
import { RunsChartBucket } from './runs-stats.types';
import { RunsChartPeriod } from './runs-stats.utils';

export const RunsStatsLoading = () => {
	return (
		<main
			className="flex flex-col bg-bg-primary rounded-md"
			data-testid="runs-stats-loading"
		>
			<CardHeader label="Runs Stats" />
			<Skeleton className="h-screen" />
		</main>
	);
};

export const RunsStatsEmpty = () => {
	return (
		<BublikEmptyState
			title="No results"
			description="No results found"
			className="h-[calc(100vh-256px)]"
		/>
	);
};

interface RunsStatsErrorProps {
	error: unknown;
}

export const RunsStatsError = (props: RunsStatsErrorProps) => {
	const { error = {} } = props;

	return <BublikErrorState error={error} className="h-[calc(100vh-256px)]" />;
};

export interface RunsStatsProps {
	stats: RunsChartBucket[];
	period: RunsChartPeriod;
	onPeriodChange: (period: RunsChartPeriod) => void;
}

export const RunsStats = (props: RunsStatsProps) => {
	const { stats, period, onPeriodChange } = props;
	const periodLabel = PERIOD_LABELS[period].toLowerCase();

	return (
		<main className="flex flex-col gap-1" data-testid="runs-stats">
			<div className="bg-bg-primary rounded-md">
				<CardHeader label="Conclusion Stats">
					<PeriodToggle period={period} onPeriodChange={onPeriodChange} />
				</CardHeader>
				<ConclusionSection stats={stats} periodLabel={periodLabel} />
			</div>
			<div className="bg-bg-primary rounded-md">
				<CardHeader label="Tests Stats" />
				<TestsSection stats={stats} periodLabel={periodLabel} />
			</div>
		</main>
	);
};
