/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useMemo } from 'react';

import {
	getErrorMessage,
	useGetSingleMeasurementQuery
} from '@/services/bublik-api';
import { Plot } from '@/shared/charts';
import { type SingleMeasurementChart } from '@/services/bublik-api';

import { Skeleton, Icon, cn, useSidebar } from '@/shared/tailwind-ui';

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

export const ChartsError = ({ error = {} }: ChartsErrorProps) => {
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
}

export const ChartsContainer = ({ resultId, layout }: ChartsProps) => {
	const { isSidebarOpen } = useSidebar();
	const { data, isLoading, error } = useGetSingleMeasurementQuery(resultId);

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
					return (
						<div className="py-2.5 px-4" key={plot.id}>
							<SingleMeasurementChart chart={plot} />
						</div>
					);
				})}
			</div>
		);
	}

	return (
		<div className="flex flex-col children-but-last:border-b children-but-last:border-b-border-primary">
			{data.charts.map((plot, idx) => {
				return (
					<div className="py-2.5 px-4" key={plot.id}>
						<SingleMeasurementChart chart={plot} />
					</div>
				);
			})}
		</div>
	);
};

interface SingleMeasurementChartProps {
	chart: SingleMeasurementChart;
}

function SingleMeasurementChart({ chart }: SingleMeasurementChartProps) {
	const series = useMemo(
		() =>
			(chart.dataset?.[0] ?? [])
				.filter((name) => name !== chart.axis_x_key)
				.map((name) => {
					return {
						type: 'line',
						name: name,
						encode: { x: chart.axis_x_key, y: chart.axis_y_key }
					} as const;
				}),
		[chart.dataset, chart.axis_x_key, chart.axis_y_key]
	);

	return (
		<div>
			<Plot
				options={{
					legend: {},
					title: {
						text: chart.title,
						textStyle: { fontFamily: 'Inter', fontSize: 12, fontWeight: 600 }
					},
					grid: { containLabel: true },
					tooltip: {
						textStyle: {},
						extraCssText: 'shadow-popover rounded-lg',
						trigger: 'axis'
					},
					dataZoom: [{}, { type: 'inside' }],
					dataset: { source: chart.dataset },
					xAxis: { type: 'category', name: chart.axis_x_label },
					yAxis: { type: 'value', name: chart.axis_y_label },
					series
				}}
			/>
		</div>
	);
}
