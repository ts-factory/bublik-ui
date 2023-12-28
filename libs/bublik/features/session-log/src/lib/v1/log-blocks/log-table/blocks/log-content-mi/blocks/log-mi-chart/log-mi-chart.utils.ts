/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { upperCaseFirstLetter } from '@/shared/utils';
import {
	SeriesOption,
	XAXisComponentOption,
	YAXisComponentOption
} from '@/shared/charts';

import {
	LogContentAxisXSchema,
	LogContentAxisYSchema,
	LogContentMiChart,
	LogContentMiChartResults
} from '@/shared/types';
import { ResultDescriptionItem } from './log-mi-chart.types';

export const convertResults = (
	values: LogContentMiChart['results']
): ResultDescriptionItem[] => {
	return values.map((result) => ({
		parameterName: result.description,
		values: result.entries.map((entry) => ({
			units: entry.base_units,
			value: entry.value,
			multiplier: entry.multiplier
		}))
	}));
};

export interface Config {
	results: Array<LogContentMiChart['results'][number]>;
	views: Array<LogContentMiChart['views'][number]>;
}

export interface ChartConfig {
	title: string;
	xAxis: XAXisComponentOption;
	yAxises: YAXisComponentOption[];
	series: SeriesOption[];
	legends: string[];
	errors: string[];
}

export const convertRawToCharts = (config: Config): ChartConfig[] => {
	const { results, views } = config;

	type XAxisConfig = {
		axis: LogContentAxisXSchema;
		results: LogContentMiChartResults;
	};

	const createXAxis = (
		config: XAxisConfig
	): { resultType: string; axis: XAXisComponentOption } => {
		const { axis, results } = config;

		if (!axis.type || axis.name === 'auto-seqno') {
			const maxLength = results
				.map((result) => result.entries.length)
				.reduce((acc, val) => Math.max(acc, val));

			return {
				resultType: 'auto-seqno',
				axis: {
					type: 'category',
					axisTick: { alignWithLabel: true },
					data: Array.from({ length: maxLength - 1 }, (_, idx) => idx)
				}
			};
		}

		const result = results.find((result) => result.type === axis.type);
		const units = result?.entries?.[0]?.base_units;

		const data = result?.entries?.map((entry) =>
			(Number(entry.value) * Number(entry.multiplier)).toFixed(3)
		);

		return {
			resultType: axis.type,
			axis: {
				type: 'category',
				axisTick: { alignWithLabel: true },
				axisLabel: { formatter: `{value} ${units}` },
				data
			}
		};
	};

	type YAxisConfig = {
		xAxisResultType: string;
		axis: LogContentAxisYSchema;
		results: LogContentMiChartResults;
	};

	const createYaxises = (
		config: YAxisConfig
	): { type: string; axis: YAXisComponentOption }[] => {
		const { xAxisResultType, axis, results } = config;

		if (!axis) {
			return results
				.filter((result) => result.type !== xAxisResultType)
				.map((result) => {
					const units = result.entries?.[0]?.base_units;

					return {
						type: result.type,
						axis: {
							type: 'value',
							name: result.name,
							position: 'left',
							alignTicks: true,
							axisLine: { show: true, lineStyle: {} },
							axisLabel: { formatter: `{value} ${units}` }
						}
					};
				});
		}

		return axis.map((axis) => {
			const units = results.find(
				(result) => result.type === axis.type && result.name === axis.name
			)?.entries[0]?.base_units;

			return {
				type: axis.type,
				axis: {
					type: 'value',
					name: axis.name,
					position: 'left',
					alignTicks: true,
					axisLine: { show: true, lineStyle: {} },
					axisLabel: { formatter: `{value} ${units}` }
				}
			};
		});
	};

	type SeriesConfig = {
		yAxises: ReturnType<typeof createYaxises>;
		results: LogContentMiChartResults;
	};

	const createSeries = (config: SeriesConfig): SeriesOption[] => {
		return config.yAxises.map((yAxis) => {
			const data =
				config.results
					.find(
						(result) =>
							result.type === yAxis.type && result.name === yAxis.axis.name
					)
					?.entries.map((entry) =>
						(Number(entry.value) * Number(entry.multiplier)).toFixed(3)
					) || [];

			return {
				name: yAxis.axis.name || upperCaseFirstLetter(yAxis.type),
				type: 'line',
				data
			};
		});
	};

	return views.map((view) => {
		const { title, axis_x, axis_y } = view;

		const xAxis = createXAxis({ axis: axis_x, results });
		const yAxises = createYaxises({
			axis: axis_y,
			results,
			xAxisResultType: xAxis.resultType
		});

		const series = createSeries({ yAxises, results });

		const errors: string[] = [];
		series.forEach((series) => {
			const seriesData = series.data as number[] | string[];
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-expect-error
			const axisXData = xAxis.axis.data as string[] | number[];

			if (seriesData.length !== axisXData.length) {
				errors.push(
					`Parameter '${series.name}' on axis Y has ${seriesData.length} values while on axis X there is ${axisXData.length} values.`
				);
			}
		});

		return {
			title,
			xAxis: xAxis.axis,
			yAxises: yAxises.map((root) => root.axis),
			series,
			legends: series.map((series) => series.name) as string[],
			errors
		};
	});
};
