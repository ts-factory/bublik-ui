/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useState } from 'react';

import { Point } from '@/shared/types';
import {
	CardHeader,
	cn,
	Icon,
	Skeleton,
	ToolbarButton,
	useSidebar
} from '@/shared/tailwind-ui';
import {
	ExportChart,
	getColorByIdx,
	isDisabledForCombined,
	MeasurementChart,
	SelectedChartsPopover
} from '@/shared/charts';
import { SingleMeasurementChart } from '@/services/bublik-api';
import { LogPreviewContainer } from '@/bublik/features/log-preview-drawer';

import { useCombinedView } from './plot-list.hooks';
import { resolvePoint } from './plot-list.utils';

interface PlotListItemProps {
	idx: number;
	plot: SingleMeasurementChart;
	onAddChartClick: (args: {
		plot: SingleMeasurementChart;
		color: string;
	}) => void;
	combinedState: 'disabled' | 'active' | 'default' | 'waiting';
}

const PlotListItem = (props: PlotListItemProps) => {
	const { idx, plot, combinedState, onAddChartClick } = props;
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [point, setPoint] = useState<Point | null>(null);

	const handleChartPointClick = async (opts: { dataIndex: number }) => {
		const { dataIndex } = opts;
		const point = resolvePoint(plot, dataIndex);

		if (!point) return;

		setIsDialogOpen(true);
		setPoint(point);
	};

	const handleChartAddClick = (plot: SingleMeasurementChart) => {
		onAddChartClick({ plot, color: getColorByIdx(idx) });
	};

	return (
		<>
			{point && (
				<LogPreviewContainer
					runId={point.run_id}
					resultId={point.result_id}
					measurementId={point.result_id}
					open={isDialogOpen}
					onOpenChange={setIsDialogOpen}
				/>
			)}
			<li className="py-2.5 px-4">
				<MeasurementChart
					chart={plot}
					color={getColorByIdx(idx)}
					onChartPointClick={handleChartPointClick}
					additionalToolBarItems={
						<ToolbarButton
							aria-label="Add to combined chart"
							state={combinedState === 'active' ? 'active' : 'default'}
							disabled={combinedState === 'disabled'}
							onClick={() => handleChartAddClick(plot)}
						>
							<Icon name="AddSymbol" className="size-5" />
						</ToolbarButton>
					}
				/>
			</li>
		</>
	);
};

export const PlotListLoading = () => {
	return (
		<div className="bg-white rounded-md">
			<CardHeader label="Charts">
				<div className="flex items-stretch h-full gap-4">
					<Skeleton className="w-[75px] h-full rounded" />
				</div>
			</CardHeader>
			<ul className="chart-mosaic">
				{Array.from({ length: 6 }).map((_, idx) => (
					<li className="py-2.5 px-4" key={idx}>
						<Skeleton className="h-[334px] rounded" />
					</li>
				))}
			</ul>
		</div>
	);
};

export interface PlotListProps {
	plots: SingleMeasurementChart[];
	isFetching?: boolean;
}

export function PlotList({ plots, isFetching }: PlotListProps) {
	const { isSidebarOpen } = useSidebar();
	const {
		handleAddChartClick,
		handleRemoveClick,
		handleResetButtonClick,
		selectedCharts,
		handleOpenButtonClick
	} = useCombinedView();

	return (
		<div
			className={cn(
				'bg-white rounded-md',
				isFetching && 'pointer-events-none opacity-60'
			)}
		>
			<div className="sticky top-0 z-10 bg-white rounded-md">
				<CardHeader label="Charts" enableStickyShadow>
					<div className="flex items-stretch gap-4">
						<ExportChart plots={plots} />
					</div>
				</CardHeader>
			</div>
			<ul
				className={cn(
					'[&>li]:border-b [&>li]:border-border-primary',
					isSidebarOpen
						? 'min-[1465px]:chart-mosaic'
						: 'min-[1368px]:chart-mosaic'
				)}
			>
				{plots.map((plot, idx) => {
					const isDisabled = isDisabledForCombined(
						plot,
						selectedCharts.map(({ plot }) => plot)
					);

					const state = selectedCharts.length
						? isDisabled
							? 'disabled'
							: selectedCharts.find(({ plot: p }) => p.id === plot.id)
							? 'active'
							: 'waiting'
						: 'default';

					return (
						<PlotListItem
							key={`${idx}_${plot.id}`}
							idx={idx}
							plot={plot}
							onAddChartClick={handleAddChartClick}
							combinedState={state}
						/>
					);
				})}
			</ul>
			<SelectedChartsPopover
				open={!!selectedCharts.length}
				label="Combined"
				plots={selectedCharts}
				onResetButtonClick={handleResetButtonClick}
				onRemoveClick={handleRemoveClick}
				onOpenButtonClick={handleOpenButtonClick}
			/>
		</div>
	);
}
