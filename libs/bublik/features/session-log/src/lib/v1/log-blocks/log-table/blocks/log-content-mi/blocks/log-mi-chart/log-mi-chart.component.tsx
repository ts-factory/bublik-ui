/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useMemo } from 'react';

import { useToggle } from '@/shared/hooks';
import { JsonViewer, cn } from '@/shared/tailwind-ui';
import { ReactECharts, twTheme } from '@/shared/charts';

import { LogContentMiChart } from '@/shared/types';
import {
	ResultDescriptionItem,
	ResultDescriptionValue
} from './log-mi-chart.types';
import {
	ChartConfig,
	convertRawToCharts,
	convertResults
} from './log-mi-chart.utils';

export interface ResultDescriptionListProps {
	items: ResultDescriptionItem[];
}

export const ResultDescriptionList = (props: ResultDescriptionListProps) => {
	return (
		<ul className="flex flex-col gap-4">
			{props.items.map((item) => (
				<li key={item.parameterName}>
					<ResultDescription
						parameterName={item.parameterName}
						values={item.values}
						statistics={item.statistics}
					/>
				</li>
			))}
		</ul>
	);
};

export interface ResultDescriptionProps {
	parameterName: string;
	values: ResultDescriptionValue[];
	statistics?: ResultDescriptionValue[];
}

export const ResultDescription = (props: ResultDescriptionProps) => {
	const { parameterName, values, statistics } = props;
	const [isOpen, toggle] = useToggle();

	return (
		<div>
			<h2 className="font-bold">Measured parameter: "{parameterName}"</h2>
			{statistics && statistics.length ? (
				<div className="pl-10">
					<span className="block font-bold">Statistics:</span>
					<ul className="pl-4">
						{statistics.map((stat, idx) => (
							<li key={idx}>
								{stat.aggr}: {stat.value} * {stat.multiplier} {stat.units}
							</li>
						))}
					</ul>
				</div>
			) : null}
			<div className="pl-10">
				<span className="block font-bold">Values:</span>
				<button
					onClick={toggle}
					className={cn(
						'hover:underline pl-4',
						isOpen && 'text-text-unexpected',
						!isOpen && 'text-primary'
					)}
				>
					{isOpen
						? `Hide ${values.length} values`
						: `Show ${values.length} values`}
				</button>
				<ul className="pl-10">
					{isOpen
						? values.map((item, idx) => (
								<li key={idx}>
									{item.value} * {item.multiplier} {item.units}
								</li>
						  ))
						: null}
				</ul>
			</div>
		</div>
	);
};

export interface ChartListProps {
	charts: ChartConfig[];
}

export const ChartList = (props: ChartListProps) => {
	return (
		<ul className="flex flex-col gap-4">
			{props.charts.map((config) => (
				<li key={config.title}>
					<Chart config={config} />
				</li>
			))}
		</ul>
	);
};

export interface ChartProps {
	config: ChartConfig;
}

export const Chart = (props: ChartProps) => {
	const { series, title, xAxis, yAxises, legends, errors } = props.config;

	return (
		<div className="bg-white py-4 rounded-md">
			<h2 className="font-bold text-center">{title}</h2>
			<ReactECharts
				option={{
					toolbox: {
						feature: {
							dataView: { show: true, readOnly: false },
							restore: { show: true },
							saveAsImage: { show: true }
						}
					},
					dataZoom: [
						{ type: 'inside', show: true },
						{ show: true, type: 'slider', height: 20 }
					],
					grid: { containLabel: true },
					tooltip: { trigger: 'axis' },
					legend: { data: legends },
					xAxis,
					yAxis: yAxises,
					series
				}}
				theme={twTheme.theme}
			/>
			{errors.length ? (
				<ul className="flex flex-col gap-2">
					{errors.map((error, idx) => (
						<li key={idx} className="text-text-unexpected">
							{error}
						</li>
					))}
				</ul>
			) : null}
		</div>
	);
};

export const LogMiChart = (props: LogContentMiChart) => {
	const items = useMemo<ResultDescriptionItem[]>(
		() => convertResults(props.results),
		[props.results]
	);

	const chartViews = useMemo<ChartConfig[]>(
		() => convertRawToCharts({ results: props.results, views: props.views }),
		[props.results, props.views]
	);

	return (
		<div className="flex flex-col gap-4">
			<h1 className="font-bold">
				Measurements from tool {props.tool.toLowerCase()}
			</h1>
			<ResultDescriptionList items={items} />
			<ChartList charts={chartViews} />
			<JsonViewer src={props} />
		</div>
	);
};
