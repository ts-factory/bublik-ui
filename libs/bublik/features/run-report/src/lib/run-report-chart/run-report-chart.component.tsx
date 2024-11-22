/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { ComponentProps, useMemo } from 'react';

import { Plot, chartStyles } from '@/shared/charts';
import { ReportChart } from '@/shared/types';

interface RunReportChartProps {
	chart: ReportChart;
}

function RunReportChart(props: RunReportChartProps) {
	const { chart } = props;

	const series = useMemo<
		ComponentProps<typeof Plot>['options']['series']
	>(() => {
		return chart.data.map((d) => ({
			name: d.series,
			type: 'line',
			data: d.points.map((d) => d[chart.axis_y.key])
		}));
	}, []);

	return (
		<div className="w-full flex flex-col gap-2">
			<Plot
				options={{
					toolbox: { top: 9999, feature: { dataZoom: {} } },
					tooltip: {
						trigger: 'axis',
						textStyle: chartStyles.text,
						extraCssText: 'shadow-popover rounded-lg',
						axisPointer: { type: 'cross' }
					},
					legend: { data: chart.data.map((s) => s.series) },
					grid: { containLabel: true },
					dataZoom: [{}, { type: 'inside' }],
					xAxis: {
						type: 'category',
						name: chart.axis_x.label,
						nameLocation: 'middle',
						nameGap: 20,
						nameTextStyle: chartStyles.text,
						axisLabel: { ...chartStyles.text }
					},
					yAxis: {
						type: 'value',
						name: chart.axis_y.label,
						nameGap: 20,
						nameLocation: 'end',
						axisLabel: chartStyles.text,
						nameTextStyle: chartStyles.text
					},
					series: series
				}}
			/>
		</div>
	);
}

export { RunReportChart };
