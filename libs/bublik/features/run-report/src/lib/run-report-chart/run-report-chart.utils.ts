/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2025 OKTET LTD */
import { ComponentProps } from 'react';
import { z } from 'zod';

import { chartStyles, EChartsOption, Plot } from '@/shared/charts';
import { ReportChart } from '@/shared/types';

const ParamsSchema = z.object({
	seriesIndex: z.number(),
	dataIndex: z.number()
});

interface RunReportChartConfigOptions {
	chart: ReportChart;
	isCtrlPressed: boolean;
}

function resolveRunReportChartOptions(
	options: RunReportChartConfigOptions
): EChartsOption {
	const { chart, isCtrlPressed } = options;

	const dataZoom = [{}, { type: 'inside', zoomLock: !isCtrlPressed }];
	const series: ComponentProps<typeof Plot>['options']['series'] =
		chart.data.map((d) => ({
			name:
				chart.series_label === null && chart.data.length === 1
					? chart.axis_y.label
					: d.series,
			type: 'line',
			data: d.points.map((d) => [d?.[chart.axis_x.key], d?.[chart.axis_y.key]]),
			itemStyle: {
				color: (params: unknown) => {
					const parsedParams = ParamsSchema.safeParse(params);
					if (!parsedParams.success) return '#65cd84';

					const point = d.points[parsedParams.data.dataIndex];
					const hasError = point?.metadata?.has_error;

					if (hasError) return '#f95c78';
					return '#65cd84';
				}
			},
			symbol: (_, params: unknown) => {
				const parsedParams = ParamsSchema.safeParse(params);
				if (!parsedParams.success) return 'emptyCircle';

				const point = d.points[parsedParams.data.dataIndex];
				const hasError = point?.metadata?.has_error;

				if (hasError) return 'diamond';
				return 'emptyCircle';
			},
			symbolSize: (_, params: unknown) => {
				const parsedParams = ParamsSchema.safeParse(params);
				if (!parsedParams.success) return 8;

				const point = d.points[parsedParams.data.dataIndex];
				const hasError = point?.metadata?.has_error;

				if (hasError) return 16;
				return 8;
			}
		}));

	return {
		toolbox: { top: 9999, feature: { dataZoom: {} } },
		title: {
			show: Boolean(chart.series_label),
			text: chart.series_label,
			left: 'center',
			textStyle: { fontSize: 12, fontFamily: 'Inter' }
		},
		tooltip: {
			trigger: 'axis',
			textStyle: chartStyles.text,
			extraCssText: 'shadow-popover rounded-lg',
			axisPointer: { type: 'shadow' }
		},
		legend: {
			data: chart.data.map((s) => s.series ?? ''),
			show: Boolean(chart.series_label),
			padding: chart.series_label ? [25, 0, 0, 0] : undefined
		},
		grid: {
			containLabel: true,
			top:
				Boolean(chart.series_label) && chart.data.length >= 4 ? '28%' : '15%',
			right: '7%',
			left: '5%',
			bottom: '20%'
		},
		dataZoom,
		xAxis: {
			type: 'value',
			name: chart.axis_x.label,
			nameLocation: 'middle',
			nameGap: 30,
			nameTextStyle: chartStyles.text,
			axisLabel: { ...chartStyles.text },
			scale: true
		},
		yAxis: {
			type: 'value',
			name: chart.axis_y.label,
			nameGap: 20,
			nameLocation: 'end',
			axisLabel: chartStyles.text,
			nameTextStyle: { ...chartStyles.text, align: 'left' }
		},
		series: series
	};
}

export { resolveRunReportChartOptions, ParamsSchema };
