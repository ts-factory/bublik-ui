import { ComponentProps } from 'react';
import { isDate } from 'date-fns';

import { SingleMeasurementChart } from '@/services/bublik-api';

import { Plot } from '../plot';
import { getColorByIdx } from '../utils';

function resolveXAxisType(
	axis_x_key: string,
	dataset: SingleMeasurementChart['dataset']
) {
	const isTimeAxis = dataset.slice(1).every((row) => {
		const xValue = row[dataset[0].indexOf(axis_x_key)];

		return (
			isDate(new Date(xValue)) &&
			!isNaN(new Date(xValue).getTime()) &&
			typeof xValue === 'string'
		);
	});

	return isTimeAxis ? 'time' : 'category';
}

type ChartState = {
	mode: string;
	isGlobalZoomEnabled: boolean;
	isSlidersVisible: boolean;
	isFullScreen: boolean;
};

const axisLabelStyles = {
	fontFamily: 'Inter',
	fontSize: 10,
	fontWeight: 500,
	lineHeight: 18
};

function resolveDataZoom(
	state: ChartState,
	isModifierPressed = false,
	isFullScreen = false
) {
	const dataZoom = [];

	dataZoom.push({
		type: 'inside',
		xAxisIndex: [0],
		zoomLock: !isModifierPressed
	});
	dataZoom.push({
		type: 'inside',
		yAxisIndex: [0],
		zoomLock: !isModifierPressed
	});

	if (state.isSlidersVisible) {
		dataZoom.push({
			type: 'slider',
			show: true,
			xAxisIndex: [0],
			bottom: isFullScreen ? 50 : 15
		});
		dataZoom.push({
			type: 'slider',
			show: true,
			yAxisIndex: [0],
			right: isFullScreen ? 70 : 0,
			bottom: isFullScreen ? '15%' : '30%'
		});
	}

	return dataZoom;
}

function resolveGrid(state: ChartState, isFullScreen = false) {
	return {
		bottom: state.isSlidersVisible ? (isFullScreen ? '15%' : '30%') : '15%',
		top: isFullScreen ? '7%' : '15%',
		left: isFullScreen ? '5%' : '10%',
		right: '7%'
	};
}

function resolveOptions(
	chart: SingleMeasurementChart,
	state: ChartState,
	additionalOptions: Partial<{
		color: string;
		isModifierPressed?: boolean;
		isFullScreen?: boolean;
	}>
) {
	const xAxisType = resolveXAxisType(chart.axis_x.key, chart.dataset);

	const options: ComponentProps<typeof Plot>['options'] = {
		toolbox: { top: 9999, feature: { dataZoom: {} } },
		dataZoom: resolveDataZoom(
			state,
			additionalOptions.isModifierPressed,
			additionalOptions.isFullScreen
		),
		grid: resolveGrid(state, additionalOptions.isFullScreen),
		tooltip: {
			trigger: 'axis',
			textStyle: axisLabelStyles,
			extraCssText: 'shadow-popover rounded-lg',
			axisPointer: { type: 'line' }
		},
		dataset: { source: chart.dataset },
		xAxis: {
			type: xAxisType,
			name: chart.axis_x.label,
			nameLocation: 'middle',
			nameGap: 20,
			nameTextStyle: axisLabelStyles,
			axisLabel: { ...axisLabelStyles }
		},
		yAxis: {
			type: 'value',
			name: chart.axis_y.label,
			nameGap: 20,
			nameLocation: 'end',
			axisLabel: axisLabelStyles,
			nameTextStyle: { ...axisLabelStyles, align: 'left' }
		},
		series: [
			{
				type: 'line',
				color: additionalOptions.color,
				encode: { x: chart.axis_x.key, y: chart.axis_y.key }
			}
		]
	};

	return options;
}

function resolveStackedOptions(
	plots: SingleMeasurementChart[]
): ComponentProps<typeof Plot>['options'] {
	const Y_AXIS_SPACING = 120;

	const axisLabelStyles = {
		fontFamily: 'Inter',
		fontSize: 10,
		fontWeight: 500,
		lineHeight: 18
	};

	return {
		toolbox: {
			top: 9999,
			feature: {
				dataZoom: { xAxisIndex: [0], yAxisIndex: plots.map((_, i) => i) }
			}
		},
		dataset: plots.map((plot, idx) => ({
			id: `dataset_${idx}`,
			source: plot.dataset
		})),
		xAxis: {
			type: resolveXAxisType(plots[0].axis_x.key, plots[0].dataset),
			name: plots[0].axis_x.label,
			nameLocation: 'middle',
			nameGap: 20,
			nameTextStyle: axisLabelStyles,
			axisLabel: axisLabelStyles
		},
		yAxis: plots.map((plot, idx) => ({
			type: 'value',
			name: plot.axis_y.label,
			nameGap: 20,
			nameLocation: 'end',
			axisLabel: axisLabelStyles,
			nameTextStyle: { ...axisLabelStyles, align: 'right' },
			position: 'right',
			offset: idx * Y_AXIS_SPACING,
			axisLine: { show: true, lineStyle: { color: getColorByIdx(idx) } },
			axisTick: { show: true },
			scale: true
		})),
		series: plots.map((plot, idx) => ({
			type: 'line',
			name: plot.title,
			datasetId: `dataset_${idx}`,
			yAxisIndex: idx,
			color: getColorByIdx(idx),
			encode: { x: plot.axis_x.key, y: plot.axis_y.key },
			symbolSize: 5.5,
			id: `${plot.title}_${idx}`
		})),
		dataZoom: [
			{ type: 'inside', xAxisIndex: [0] },
			{ type: 'inside', yAxisIndex: plots.map((_, i) => i) },
			{ type: 'slider', xAxisIndex: [0], bottom: 10 }
		],
		grid: {
			top: 40,
			left: '5%',
			right: `${10 * plots.length}%`,
			bottom: '15%'
		},
		tooltip: {
			trigger: 'axis',
			textStyle: axisLabelStyles,
			extraCssText: 'shadow-popover rounded-lg',
			axisPointer: { type: 'cross' }
		},
		legend: { left: 'left' }
	};
}

export {
	resolveXAxisType,
	resolveOptions,
	type ChartState,
	resolveStackedOptions
};
