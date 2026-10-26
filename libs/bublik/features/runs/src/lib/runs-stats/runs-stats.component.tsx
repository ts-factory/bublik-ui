/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { CardHeader, Skeleton } from '@/shared/tailwind-ui';
import { BublikEmptyState, BublikErrorState } from '@/bublik/features/ui-state';

import {
	ConclusionSection,
	PeriodToggle,
	RunsListDrawer,
	SummaryTiles,
	TestsSection
} from './components';
import { RunsChartBucket } from './runs-stats.types';
import { RunsChartPeriod, formatPeriodRange } from './runs-stats.utils';
import {
	RunsChartSelection,
	getSelectionRunIds,
	getSelectionTitle,
	getSummary
} from './runs-stats.component.utils';
import { useLinkedTimelines } from './runs-stats.hooks';

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

interface SelectionDrawerProps {
	stats: RunsChartBucket[];
	period: RunsChartPeriod;
	selection: RunsChartSelection | null;
	onSelectionChange: (selection: RunsChartSelection | null) => void;
}

const SelectionDrawer = (props: SelectionDrawerProps) => {
	const { stats, period, selection, onSelectionChange } = props;
	const ids = selection ? getSelectionRunIds(stats, selection) : [];
	const scope = selection?.bucket
		? formatPeriodRange(selection.bucket.date, period)
		: 'Whole range';

	return (
		<RunsListDrawer
			open={selection !== null}
			onOpenChange={(open) => {
				if (!open) onSelectionChange(null);
			}}
			title={selection ? getSelectionTitle(selection) : ''}
			description={`${scope} · ${ids.length} ${
				ids.length === 1 ? 'run' : 'runs'
			}`}
			ids={ids}
		/>
	);
};

export const RunsStats = (props: RunsStatsProps) => {
	const { stats, period, onPeriodChange, selection, onSelectionChange } = props;
	const timelines = useLinkedTimelines();

	return (
		// From xl up the charts share the height under the page header, as the
		// log page fills the viewport; narrower, they stack at a fixed height
		<main
			className="flex flex-col gap-1 xl:h-[calc(100svh-92px)] xl:min-h-[640px]"
			data-testid="runs-stats"
		>
			<SelectionDrawer
				stats={stats}
				period={period}
				selection={selection}
				onSelectionChange={onSelectionChange}
			/>
			<div className="bg-bg-primary rounded-md shrink-0">
				<CardHeader label="Overview">
					<PeriodToggle period={period} onPeriodChange={onPeriodChange} />
				</CardHeader>
				<SummaryTiles summary={getSummary(stats)} />
			</div>
			<div className="flex flex-col bg-bg-primary rounded-md xl:flex-1 xl:min-h-0">
				<CardHeader label="Runs by conclusion" />
				<ConclusionSection
					stats={stats}
					period={period}
					onSelect={onSelectionChange}
					timelineRef={timelines.register('conclusions')}
					onTimelineZoom={() => timelines.syncZoomFrom('conclusions')}
					onTimelinePointer={(params) =>
						timelines.syncPointerFrom('conclusions', params)
					}
				/>
			</div>
			<div className="flex flex-col bg-bg-primary rounded-md xl:flex-1 xl:min-h-0">
				<CardHeader label="Test results" />
				<TestsSection
					stats={stats}
					period={period}
					onSelect={onSelectionChange}
					chartRef={timelines.register('tests')}
					onZoom={() => timelines.syncZoomFrom('tests')}
					onPointer={(params) => timelines.syncPointerFrom('tests', params)}
				/>
			</div>
		</main>
	);
};
