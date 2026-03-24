/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useGetSingleMeasurementQuery } from '@/services/bublik-api';
import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import { getColorByIdx } from '@/shared/charts';
import {
	Skeleton,
	Icon,
	cn,
	useSidebar,
	ToolbarButton
} from '@/shared/tailwind-ui';
import { MeasurementChart } from '@/shared/charts';
import { BublikEmptyState, BublikErrorState } from '@/bublik/features/ui-state';

import { useResultSelectCharts } from '../../hooks';

export const ChartsEmpty = () => {
	return (
		<BublikEmptyState title="No data" description="Chart is empty" hideIcon />
	);
};

export const ChartsLoading = ({ layout }: { layout: ChartsTiling }) => {
	return (
		<ul className={layout === 'mosaic' ? 'chart-mosaic' : undefined}>
			<li className="py-2.5 px-4">
				<Skeleton className="h-[334px] rounded" />
			</li>
			<li className="py-2.5 px-4">
				<Skeleton className="h-[334px] rounded" />
			</li>
			<li className="py-2.5 px-4">
				<Skeleton className="h-[334px] rounded" />
			</li>
			<li className="py-2.5 px-4">
				<Skeleton className="h-[334px] rounded" />
			</li>
		</ul>
	);
};

export interface ChartsErrorProps {
	error: unknown;
}

export function ChartsError({ error = {} }: ChartsErrorProps) {
	return <BublikErrorState error={error} iconSize={48} className="my-20" />;
}

export type ChartsTiling = 'row' | 'mosaic';

export interface ChartsProps {
	layout: ChartsTiling;
	resultId: string;
	isLockedMode?: boolean;
}

export function ChartsContainer(props: ChartsProps) {
	const { resultId, layout } = props;
	const { isSidebarOpen } = useSidebar();
	const { data, isLoading, error } = useGetSingleMeasurementQuery(resultId);
	const { selectedCharts, handleChartClick } = useResultSelectCharts();

	const handleMeasurementChartClick = (chartId: number) => {
		const isSelected = selectedCharts.includes(chartId);

		trackEvent(analyticsEventNames.measurementsChartSelect, {
			action: isSelected ? 'remove' : 'add',
			selectedCount: isSelected
				? Math.max(selectedCharts.length - 1, 0)
				: selectedCharts.length + 1
		});
	};

	const handleChartToolbarAction = (
		action: string,
		chartId: number,
		payload?: unknown
	) => {
		trackEvent(analyticsEventNames.measurementsChartToolbarAction, {
			action,
			chartId,
			payload
		});
	};

	if (isLoading) return <ChartsLoading layout={layout} />;

	if (error) return <ChartsError error={error} />;

	if (!data) return <ChartsEmpty />;

	if (layout === 'mosaic') {
		return (
			<div
				className={cn(
					'[&>li]:border-b [&>li]:border-border-primary',
					isSidebarOpen
						? 'min-[1465px]:chart-mosaic'
						: 'min-[1368px]:chart-mosaic'
				)}
			>
				{data.charts.map((plot, idx) => {
					const state = selectedCharts.includes(plot.id) ? 'active' : 'default';

					return (
						<div className="py-2.5 px-4" key={plot.id}>
							<MeasurementChart
								key={plot.id}
								chart={plot}
								color={getColorByIdx(idx)}
								onToolbarAction={handleChartToolbarAction}
								additionalToolBarItems={
									<ToolbarButton
										aria-label="Add to combined chart"
										state={state}
										onClick={() => {
											handleMeasurementChartClick(plot.id);
											handleChartClick(plot);
										}}
									>
										<Icon name="AddSymbol" className="size-5" />
									</ToolbarButton>
								}
							/>
						</div>
					);
				})}
			</div>
		);
	}

	return (
		<div className="flex flex-col children-but-last:border-b children-but-last:border-b-border-primary">
			{data.charts.map((plot, idx) => {
				const state = selectedCharts.includes(plot.id) ? 'active' : 'default';

				return (
					<div className="py-2.5 px-4" key={plot.id}>
						<MeasurementChart
							key={plot.id}
							chart={plot}
							color={getColorByIdx(idx)}
							onToolbarAction={handleChartToolbarAction}
							additionalToolBarItems={
								<ToolbarButton
									aria-label="Add to combined chart"
									state={state}
									onClick={() => {
										handleMeasurementChartClick(plot.id);
										handleChartClick(plot);
									}}
								>
									<Icon name="AddSymbol" className="size-5" />
								</ToolbarButton>
							}
						/>
					</div>
				);
			})}
		</div>
	);
}
