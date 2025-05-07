/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC } from 'react';

import {
	getErrorMessage,
	SingleMeasurementChart,
	useGetSingleMeasurementQuery
} from '@/services/bublik-api';
import { getColorByIdx } from '@/shared/charts';
import {
	Skeleton,
	Icon,
	cn,
	useSidebar,
	ToolbarButton
} from '@/shared/tailwind-ui';
import { MeasurementChart } from '@/shared/charts';

import { useResultSelectCharts } from '../../hooks';

export const ChartsEmpty = () => <div>Chart is empty</div>;

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

export const ChartsError: FC<ChartsErrorProps> = ({ error = {} }) => {
	const { status, title, description } = getErrorMessage(error);

	return (
		<div className="flex items-center justify-center gap-4 mx-4 my-20">
			<Icon
				name="TriangleExclamationMark"
				size={48}
				className="text-text-unexpected"
			/>
			<div>
				<h2 className="text-2xl font-bold">
					{status} {title}
				</h2>
				<p>{description}</p>
			</div>
		</div>
	);
};

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
								additionalToolBarItems={
									<ToolbarButton
										aria-label="Add to combined chart"
										state={state}
										onClick={() => handleChartClick(plot)}
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
							additionalToolBarItems={
								<ToolbarButton
									aria-label="Add to combined chart"
									state={state}
									onClick={() => handleChartClick(plot)}
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
