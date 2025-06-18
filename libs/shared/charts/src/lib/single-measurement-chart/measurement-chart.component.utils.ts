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

	return isTimeAxis ? 'time' : 'value';
}

type ChartState = {
	mode: string;
	isGlobalZoomEnabled: boolean;
	isSlidersVisible: boolean;
	isFullScreen: boolean;
	limitYAxis?: boolean;
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
		enableResultErrorHighlight?: boolean;
	}>
) {
	const xAxisType = resolveXAxisType(chart.axis_x.key, chart.dataset);

	const yAxis: ComponentProps<typeof Plot>['options']['yAxis'] = {
		type: 'value',
		name: chart.axis_y.label,
		nameGap: 20,
		nameLocation: 'end',
		min: state.limitYAxis ? 'dataMin' : undefined,
		max: state.limitYAxis ? 'dataMax' : undefined,
		axisLabel: axisLabelStyles,
		nameTextStyle: { ...axisLabelStyles, align: 'left' }
	};

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
		yAxis,
		series: [
			{
				type: state.mode === 'scatter' ? 'scatter' : 'line',
				color: additionalOptions.color,
				encode: { x: chart.axis_x.key, y: chart.axis_y.key },
				itemStyle: additionalOptions.enableResultErrorHighlight
					? {
							color: (params: { dataIndex: number }) => {
								const point = chart.dataset[params.dataIndex + 1];
								if (!point) return additionalOptions.color ?? '#7283e2';

								const hasError = point[chart.dataset[0].indexOf('has_error')];
								return hasError ? '#f95c78' : '#65cd84';
							}
					  }
					: undefined,
				symbol: additionalOptions.enableResultErrorHighlight
					? (_: unknown, params: { dataIndex: number }) => {
							const point = chart.dataset[params.dataIndex + 1];
							if (!point) return 'emptyCircle';

							const hasError = point[chart.dataset[0].indexOf('has_error')];
							return hasError ? 'diamond' : 'emptyCircle';
					  }
					: state.mode === 'scatter'
					? 'circle'
					: 'emptyCircle',
				symbolSize: additionalOptions.enableResultErrorHighlight
					? (_: unknown, params: { dataIndex: number }) => {
							const point = chart.dataset[params.dataIndex + 1];
							if (!point) return 8;

							const hasError = point[chart.dataset[0].indexOf('has_error')];
							return hasError ? 16 : 8;
					  }
					: state.mode === 'scatter'
					? 8
					: 4
			}
		]
	};

	return options;
}

interface ResolveStackedOptionsProps {
	enableResultErrorHighlight?: boolean;
}

function resolveStackedOptions(
	plots: SingleMeasurementChart[],
	options: ResolveStackedOptionsProps = {}
): ComponentProps<typeof Plot>['options'] {
	const { enableResultErrorHighlight = false } = options;
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
			symbolSize: enableResultErrorHighlight
				? (_: unknown, params: { dataIndex: number }) => {
						const point = plot.dataset[params.dataIndex + 1];
						if (!point) return 8;

						const hasError = point[plot.dataset[0].indexOf('has_error')];
						return hasError ? 16 : 8;
				  }
				: 4,
			symbol: enableResultErrorHighlight
				? (_: unknown, params: { dataIndex: number }) => {
						const point = plot.dataset[params.dataIndex + 1];
						if (!point) return 'circle';

						const hasError = point[plot.dataset[0].indexOf('has_error')];
						return hasError ? 'diamond' : 'circle';
				  }
				: 'emptyCircle',
			itemStyle: enableResultErrorHighlight
				? {
						color: (params: { dataIndex: number }) => {
							const point = plot.dataset[params.dataIndex + 1];
							if (!point) return getColorByIdx(idx);

							const hasError = point[plot.dataset[0].indexOf('has_error')];
							return hasError ? '#f95c78' : '#65cd84';
						}
				  }
				: undefined,
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
