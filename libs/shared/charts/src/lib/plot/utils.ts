/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { MeasurementPlot } from '@/shared/types';

import type {
	EChartsOption,
	XAXisComponentOption,
	YAXisComponentOption
} from '../echart';
import { getChartAxises, getChartName, getColorByIdx } from '../utils';
import { LineSeriesOption, ScatterSeriesOption } from 'echarts/charts';

const axisLabelStyles = {
	fontFamily: 'Inter',
	fontSize: 10,
	fontWeight: 500,
	lineHeight: 18
};

const createYAxis = (
	config: EChartsOption['yAxis']
): EChartsOption['yAxis'] => {
	return {
		nameGap: 20,
		nameLocation: 'end',
		axisLabel: axisLabelStyles,
		nameTextStyle: axisLabelStyles,
		...config
	};
};

const createXAxis = (config: EChartsOption['xAxis']): XAXisComponentOption => {
	return {
		nameLocation: 'middle',
		nameGap: 20,
		axisLabel: axisLabelStyles,
		nameTextStyle: axisLabelStyles,
		...config
	};
};

const createSeries = (
	config: LineSeriesOption | ScatterSeriesOption
): ScatterSeriesOption | LineSeriesOption => ({
	symbolSize: 5.5,
	...config
});

export interface CreateDataZoomParams {
	showSliders?: boolean;
}

export const createDataZoom = (
	options: CreateDataZoomParams
): EChartsOption['dataZoom'] => {
	const dataZoom: EChartsOption['dataZoom'] = [];

	dataZoom.push({ type: 'inside', xAxisIndex: [0] });
	dataZoom.push({ type: 'inside', yAxisIndex: [0] });

	if (options.showSliders) {
		dataZoom.push({ type: 'slider', show: true, xAxisIndex: [0] });
		dataZoom.push({ type: 'slider', show: true, yAxisIndex: [0] });
	}

	return dataZoom;
};

const createToolbox = (
	config: GetOptionsSingle | GetOptionsStacked
): EChartsOption['toolbox'] => {
	if ('plot' in config) {
		return {
			top: 9999,
			feature: { dataZoom: { xAxisIndex: 0, yAxisIndex: 0 } }
		};
	} else {
		const indexes = config.plots.map((_, idx) => idx);

		return {
			top: 9999,
			feature: { dataZoom: { xAxisIndex: indexes, yAxisIndex: indexes } }
		};
	}
};

const createTooltip = (): EChartsOption['tooltip'] => {
	return {
		trigger: 'axis',
		textStyle: axisLabelStyles,
		extraCssText: 'shadow-popover rounded-lg',
		axisPointer: { type: 'cross' }
	};
};

const createGrid = (
	config: GetOptionsSingle | GetOptionsStacked
): EChartsOption['grid'] => {
	if (config.showSliders) {
		return {
			top: 40,
			left: config.fullScreen ? '10%' : '15%',
			right: config.fullScreen ? '4%' : '10%',
			bottom: 90
		};
	}

	return {
		top: 40,
		left: config.fullScreen ? '10%' : '15%',
		right: config.fullScreen ? '4%' : '5%',
		bottom: '15%'
	};
};

const getLineOptions = (config: GetOptionsSingle): EChartsOption => {
	const { axisX, axisY } = getChartAxises(config.plot);

	const xAxis =
		axisX.units === 'timestamp'
			? createXAxis({
					type: 'time',
					name: axisX.label,
					nameGap: 27
			  })
			: createXAxis({
					data: axisX.values,
					name: axisX.label,
					nameGap: 27
			  });

	const series =
		axisX.units === 'timestamp'
			? createSeries({
					type: config.mode,
					name: axisX.label,
					color: config.color,
					data: axisX.values.map((date, idx) => [date, axisY.values[idx]])
			  })
			: createSeries({
					type: config.mode,
					name: axisX.label,
					color: config.color,
					data: axisY.values
			  });

	return {
		xAxis,
		yAxis: createYAxis({ name: axisY.label }),
		series,
		dataZoom: createDataZoom({ showSliders: config.showSliders }),
		toolbox: createToolbox(config),
		grid: createGrid(config),
		tooltip: createTooltip()
	};
};

type GetOptionsGeneral = {
	mode: 'line' | 'scatter';
	color?: string;
	showSliders?: CreateDataZoomParams['showSliders'];
	fullScreen?: boolean;
};

type GetOptionsSingle = GetOptionsGeneral & { plot: MeasurementPlot };
type GetOptionsStacked = GetOptionsGeneral & { plots: MeasurementPlot[] };

export const getOptions = (config: GetOptionsSingle | GetOptionsStacked) => {
	if ('plot' in config) {
		return getLineOptions(config);
	} else {
		return getStackedOptions(config);
	}
};

const getStackedOptions = (config: GetOptionsStacked): EChartsOption => {
	const Y_AXIS_SPACING_NUMBER = 9;

	const xAxises = config.plots.map((plot, idx) => {
		const { axisX } = getChartAxises(plot);

		if (axisX.units === 'timestamp') {
			return createXAxis({
				type: 'time',
				name: axisX.label,
				nameLocation: 'middle',
				nameGap: 30,
				offset: idx * 80
			});
		}

		return createXAxis({
			data: axisX.values,
			name: axisX.label,
			nameLocation: 'middle',
			nameGap: 30,
			offset: idx * 80
		});
	});

	const yAxises = config.plots.map((plot, idx): YAXisComponentOption => {
		const { axisY } = getChartAxises(plot);

		return {
			type: 'value',
			name: axisY.label,
			nameLocation: 'end',
			offset: idx * 120,
			position: 'right',
			axisLine: { show: true, lineStyle: { color: getColorByIdx(idx) } },
			axisTick: { show: true }
		};
	});

	const series: (LineSeriesOption | ScatterSeriesOption)[] = config.plots.map(
		(plot, idx) => {
			const { axisX, axisY } = getChartAxises(plot);

			if (xAxises.some((opt) => opt.type === 'time')) {
				return createSeries({
					type: config.mode,
					name: getChartName(plot),
					data: axisX.values.map((date, idx) => [date, axisY.values[idx]]),
					yAxisIndex: idx,
					color: getColorByIdx(idx)
				});
			}

			return createSeries({
				type: config.mode,
				name: getChartName(plot),
				data: plot.dots.map((dot) => dot[plot.axises_config.default_y]),
				yAxisIndex: idx,
				color: getColorByIdx(idx)
			});
		}
	);

	return {
		xAxis: xAxises[0],
		yAxis: yAxises,
		series: series,
		legend: {},
		toolbox: createToolbox(config),
		grid: { right: `${yAxises.length * Y_AXIS_SPACING_NUMBER}%`, left: '5%' },
		tooltip: createTooltip()
	};
};
