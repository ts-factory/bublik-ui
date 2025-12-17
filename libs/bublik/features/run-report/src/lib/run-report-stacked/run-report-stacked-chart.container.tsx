/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2025 OKTET LTD */
import {
	CardHeader,
	DrawerContent,
	DrawerRoot,
	cn
} from '@/shared/tailwind-ui';
import { ReportChart } from '@/shared/types';
import { EChartsOption, Plot } from '@/shared/charts';

import { useRunReportStacked } from './run-report-stacked.hooks';

type ChartWithContext = {
	chart: ReportChart;
	argsVals?: Record<string, string | number>;
	measurementLabel: string;
};

function getDifferingParams(
	chartsWithContext: ChartWithContext[]
): Set<string> {
	const allArgsVals = chartsWithContext
		.map((c) => c.argsVals)
		.filter((args): args is Record<string, string | number> => !!args);

	if (allArgsVals.length <= 1) return new Set();

	const differingParams = new Set<string>();
	const firstArgs = allArgsVals[0];
	const allKeys = new Set(allArgsVals.flatMap((args) => Object.keys(args)));

	allKeys.forEach((key) => {
		const firstValue = firstArgs[key];
		const hasDifferentValue = allArgsVals.some(
			(args) => args[key] !== firstValue
		);
		if (hasDifferentValue) differingParams.add(key);
	});

	return differingParams;
}

function formatDifferingParams(
	argsVals: Record<string, string | number> | undefined,
	differingParams: Set<string>
): string {
	if (!argsVals || differingParams.size === 0) return '';

	const parts: string[] = [];
	differingParams.forEach((key) => {
		if (key in argsVals) {
			parts.push(`${key}: ${argsVals[key]}`);
		}
	});

	return parts.length > 0 ? parts.join(' | ') : '';
}

function createStackedOptions(records: ChartWithContext[]): EChartsOption {
	const axisLabelStyles = {
		fontFamily: 'Inter',
		fontSize: 10,
		fontWeight: 500,
		lineHeight: 18
	};

	const charts = records.map((c) => c.chart);
	const differingParams = getDifferingParams(records);

	const yAxisGroups = new Map<string, number>();
	const yAxisConfigs: EChartsOption['yAxis'] = [];

	charts.forEach((chart) => {
		const yLabel = chart.axis_y.label;
		if (!yAxisGroups.has(yLabel)) {
			const idx = yAxisConfigs.length;
			yAxisGroups.set(yLabel, idx);
			yAxisConfigs.push({
				type: 'value',
				name: yLabel,
				nameGap: 20,
				nameLocation: 'end',
				position: idx === 0 ? 'left' : 'right',
				offset: idx <= 1 ? 0 : (idx - 1) * 120,
				axisLine: { show: true },
				axisTick: { show: true },
				scale: true
			});
		}
	});

	let datasetIdCounter = 0;
	const datasets: EChartsOption['dataset'] = [];
	const seriesConfigs: EChartsOption['series'] = [];

	const measurementLabelCounts = new Map<string, number>();
	records.forEach((record) => {
		const count = measurementLabelCounts.get(record.measurementLabel) || 0;
		measurementLabelCounts.set(record.measurementLabel, count + 1);
	});

	charts.forEach((chart, chartIdx) => {
		const yAxisIndex = yAxisGroups.get(chart.axis_y.label) ?? 0;
		const chartContext = records[chartIdx];
		const paramLabel = formatDifferingParams(
			chartContext.argsVals,
			differingParams
		);

		chart.data.forEach((seriesData) => {
			const datasetId = `dataset_${datasetIdCounter++}`;

			datasets.push({
				id: datasetId,
				source: seriesData.points.map((point) => ({
					[chart.axis_x.key]: Number(point.x_value),
					[chart.axis_y.key]: Number(point.y_value),
					iteration_id: point.metadata?.iteration_id ?? 0,
					result_id: point.metadata?.result_id ?? 0
				}))
			});

			let seriesName: string;
			const labelCount = measurementLabelCounts.get(
				chartContext.measurementLabel
			);

			if (chart.data.length > 1 && chart.series_label) {
				// Multiple series with label: "series_label: series - y_axis_label (params)"
				const baseName = `${chart.series_label}: ${seriesData.series} - ${chart.axis_y.label}`;
				seriesName = paramLabel ? `${baseName} (${paramLabel})` : baseName;
			} else if (chart.data.length > 1) {
				// Multiple series without label: "series - y_axis_label (params)"
				const baseName = `${seriesData.series} - ${chart.axis_y.label}`;
				seriesName = paramLabel ? `${baseName} (${paramLabel})` : baseName;
			} else {
				if (paramLabel && labelCount && labelCount <= 1) {
					// Single chart but with params to show
					seriesName = `${chart.axis_y.label} (${paramLabel})`;
				}

				// Single series: use differing params if available to differentiate
				else if (labelCount && labelCount > 1) {
					// Multiple charts with same measurement label - need to differentiate
					if (paramLabel) {
						seriesName = `${chartContext.measurementLabel} (${paramLabel})`;
					} else {
						seriesName = `${chartIdx} - ${chartContext.measurementLabel}`;
					}
				} else if (
					chartContext.measurementLabel &&
					chartContext.measurementLabel !== chart.axis_y.label
				) {
					seriesName = chartContext.measurementLabel;
				} else {
					seriesName = chart.axis_y.label;
				}
			}

			seriesConfigs.push({
				type: 'line',
				name: seriesName,
				datasetId: datasetId,
				yAxisIndex: yAxisIndex,
				encode: { x: chart.axis_x.key, y: chart.axis_y.key },
				smooth: false,
				showSymbol: true,
				symbolSize: 6
			});
		});
	});

	const options: EChartsOption = {
		dataset: datasets,
		xAxis: {
			type: 'value',
			name: charts[0]?.axis_x.label || 'X Axis',
			nameLocation: 'middle',
			nameGap: 20,
			nameTextStyle: axisLabelStyles,
			axisLabel: axisLabelStyles
		},
		yAxis: yAxisConfigs.map((config) => ({
			...config,
			axisLabel: axisLabelStyles,
			nameTextStyle: { ...axisLabelStyles, align: 'left' }
		})),
		series: seriesConfigs,
		dataZoom: [
			{ type: 'inside', xAxisIndex: [0] },
			{ type: 'inside', yAxisIndex: charts.map((_, i) => i) },
			{ type: 'slider', xAxisIndex: [0], bottom: 10 }
		],
		grid: {
			top: '12%',
			left: '5%',
			right:
				yAxisConfigs.length > 1
					? `${8 * (yAxisConfigs.length - 1) + 5}%`
					: '5%',
			bottom: '9%'
		},
		tooltip: {
			trigger: 'axis',
			extraCssText: 'shadow-popover rounded-lg',
			textStyle: axisLabelStyles,
			axisPointer: { type: 'line' },
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			formatter: (params: any) => {
				if (!Array.isArray(params) || params.length === 0) return '';

				// Get x value - it could be at different positions
				const firstParam = params[0];
				const xValue =
					firstParam.value?.x_value ??
					firstParam.value?.[0] ??
					firstParam.axisValue;
				let tooltip = `<strong>${charts[0].axis_x.label}: ${xValue}</strong><br/>`;

				params.forEach((param: any) => {
					// Try multiple ways to get the y value
					let yValue;
					if (param.value && typeof param.value === 'object') {
						yValue =
							param.value.y_value ?? param.value[1] ?? param.data?.y_value;
					} else if (Array.isArray(param.value)) {
						yValue = param.value[1];
					} else {
						yValue = param.value;
					}

					const formattedValue =
						typeof yValue === 'number'
							? yValue.toLocaleString(undefined, { maximumFractionDigits: 2 })
							: yValue;

					tooltip += `${param.marker} ${param.seriesName}: <strong>${formattedValue}</strong><br/>`;
				});

				return tooltip;
			}
		},
		legend: {
			top: '1%',
			left: 'left',
			type: 'scroll',
			animationDurationUpdate: 200,
			pageButtonPosition: 'start'
		}
	};

	return options;
}

function RunReportStackedChartContainer() {
	const { selectedRecords, isStackedOpen, toggleStacked } =
		useRunReportStacked();

	const charts: ChartWithContext[] = selectedRecords.reduce<ChartWithContext[]>(
		(acc, r) => {
			if (!r?.chart) return acc;

			acc.push({
				chart: r.chart,
				argsVals: r.argsVals.args_vals,
				measurementLabel: r.measurement.label
			});

			return acc;
		},
		[]
	);

	if (!charts.length) return null;

	return (
		<DrawerRoot open={isStackedOpen} onOpenChange={toggleStacked}>
			<DrawerContent
				className={cn(
					'bg-white shadow-popover flex flex-col overflow-hidden w-[80vw] max-w-[80vw]'
				)}
			>
				<CardHeader label="Stacked Chart" />
				<div className="p-1 flex-1">
					<Plot
						options={createStackedOptions(charts)}
						style={{ height: '100%', width: '100%' }}
					/>
				</div>
			</DrawerContent>
		</DrawerRoot>
	);
}

export { RunReportStackedChartContainer };
