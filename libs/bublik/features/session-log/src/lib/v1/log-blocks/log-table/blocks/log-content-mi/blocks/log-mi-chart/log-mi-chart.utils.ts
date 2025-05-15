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
	return values.map((result) => {
		const statistics = result.entries
			.filter((entry) => entry.aggr !== 'single')
			.map((entry) => ({
				units: entry.base_units,
				value: entry.value,
				multiplier: entry.multiplier,
				aggr: entry.aggr
			}));

		return {
			parameterName: result.description,
			values: result.entries
				.filter((entry) => entry.aggr === 'single')
				.map((entry) => ({
					units: entry.base_units,
					value: entry.value,
					multiplier: entry.multiplier,
					aggr: entry.aggr
				})),
			statistics
		};
	});
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
	): { resultType?: string; axis: XAXisComponentOption; data: number[] } => {
		const { axis, results } = config;

		if (axis.name === 'auto-seqno') {
			const maxLength = results
				.map((result) => result.entries.length)
				.reduce((acc, val) => Math.max(acc, val));

			const data = Array.from({ length: maxLength }, (_, i) => i);

			return {
				resultType: 'auto-seqno',
				axis: {
					type: 'value',
					scale: true,
					min: 0,
					max: maxLength - 1
				},
				data
			};
		}

		const result = results.find((result) => result.type === axis.type);
		const units = result?.entries?.[0]?.base_units;
		const data =
			result?.entries?.map(
				(entry) => Number(entry.value) * Number(entry.multiplier)
			) || [];
		const min = Math.min(...data);
		const max = Math.max(...data);

		return {
			resultType: axis.type,
			axis: {
				type: 'value',
				scale: true,
				min,
				max,
				axisLabel: { formatter: `{value} ${units}` }
			},
			data
		};
	};

	type YAxisConfig = {
		xAxisResultType?: string;
		axis: LogContentAxisYSchema;
		results: LogContentMiChartResults;
	};

	const createYaxises = (
		config: YAxisConfig
	): { type?: string; axis: YAXisComponentOption }[] => {
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
							scale: true,
							alignTicks: true,
							min: (value) => value.min * 0.9,
							max: (value) => value.max * 1.1,
							nameTextStyle: { opacity: 0 },
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
					scale: true,
					position: 'left',
					alignTicks: true,
					axisLine: { show: true, lineStyle: {} },
					axisLabel: { formatter: `{value} ${units}` }
				}
			};
		});
	};

	type SeriesConfig = {
		xAxisData: number[];
		yAxises: ReturnType<typeof createYaxises>;
		results: LogContentMiChartResults;
	};

	const createSeries = (config: SeriesConfig): SeriesOption[] => {
		return config.yAxises.map((yAxis) => {
			const result = config.results.find(
				(result) =>
					result.type === yAxis.type && result.name === yAxis.axis.name
			);

			if (!result)
				return {
					name:
						yAxis.axis.name ||
						(yAxis.type ? upperCaseFirstLetter(yAxis.type) : ''),
					type: 'line',
					data: []
				};

			const yValues = result.entries
				.filter((entry) => entry.aggr === 'single')
				.map((entry) => Number(entry.value) * Number(entry.multiplier));

			const data = yValues.map((y, index) => {
				const x =
					index < config.xAxisData.length ? config.xAxisData[index] : index;

				return [x, y]; // Return as [x, y] coordinate pair
			});

			return {
				name:
					yAxis.axis.name ||
					(yAxis.type ? upperCaseFirstLetter(yAxis.type) : ''),
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

		const series = createSeries({
			xAxisData: xAxis.data,
			yAxises,
			results
		});

		const errors: string[] = [];
		series.forEach((series) => {
			const seriesData = series.data as Array<[number, number]>;

			if (seriesData.length !== xAxis.data.length) {
				errors.push(
					`Parameter '${series.name}' on axis Y has ${seriesData.length} values while on axis X there is ${xAxis.data.length} values.`
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
