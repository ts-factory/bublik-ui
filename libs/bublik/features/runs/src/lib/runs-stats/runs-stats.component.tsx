/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { CardHeader, Skeleton } from '@/shared/tailwind-ui';
import { BublikEmptyState, BublikErrorState } from '@/bublik/features/ui-state';

import {
	ConclusionSection,
	PeriodToggle,
	RunsListModal,
	SummaryTiles,
	TestsSection
} from './components';
import { RunsChartBucket } from './runs-stats.types';
import { RunsChartPeriod } from './runs-stats.utils';
import {
	RunsChartSelection,
	getSelectionRunIds,
	getSummary
} from './runs-stats.component.utils';

export const RunsStatsLoading = () => {
	return (
		<main
			className="flex flex-col bg-bg-primary rounded-md"
			data-testid="runs-stats-loading"
		>
			<CardHeader label="Overview" />
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
	selection: RunsChartSelection | null;
	onSelectionChange: (selection: RunsChartSelection | null) => void;
}

export const RunsStats = (props: RunsStatsProps) => {
	const { stats, period, onPeriodChange, selection, onSelectionChange } = props;

	return (
		<main className="flex flex-col gap-1" data-testid="runs-stats">
			<RunsListModal
				ids={selection ? getSelectionRunIds(stats, selection) : []}
				open={selection !== null}
				onOpenChange={(open) => {
					if (!open) onSelectionChange(null);
				}}
			/>
			<div className="bg-bg-primary rounded-md">
				<CardHeader label="Overview">
					<PeriodToggle period={period} onPeriodChange={onPeriodChange} />
				</CardHeader>
				<SummaryTiles summary={getSummary(stats)} />
			</div>
			<div className="bg-bg-primary rounded-md">
				<CardHeader label="Runs by conclusion" />
				<ConclusionSection
					stats={stats}
					period={period}
					onSelect={onSelectionChange}
				/>
			</div>
			<div className="bg-bg-primary rounded-md">
				<CardHeader label="Test results" />
				<TestsSection
					stats={stats}
					period={period}
					onSelect={onSelectionChange}
				/>
			</div>
		</main>
	);
};
