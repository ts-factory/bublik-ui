/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { Plot, chartStyles } from '@/shared/charts';
import { useMemo } from 'react';

interface RunReportChartProps {
	data: Array<Array<string | number>>;
	xKey: string;
	xAxisLabel: string;
	label: string;
}

function RunReportChart(props: RunReportChartProps) {
	const { data, xKey, xAxisLabel, label } = props;

	const series = useMemo(
		() =>
			data[0].slice(1).map((name) => {
				return {
					type: 'line',
					name: name,
					encode: { x: xKey, y: name }
				} as const;
			}),
		[data]
	);

	return (
		<div className="w-full">
			<Plot
				options={{
					legend: {},
					title: {
						text: label,
						textStyle: { fontFamily: 'Inter', fontSize: 12, fontWeight: 600 }
					},
					tooltip: {
						textStyle: chartStyles.text,
						extraCssText: 'shadow-popover rounded-lg',
						trigger: 'axis'
					},
					// dataZoom: [{}, { type: 'inside' }],
					dataset: { source: data },
					xAxis: { type: 'category', name: xAxisLabel },
					yAxis: { type: 'value' },
					series: series
				}}
			/>
		</div>
	);
}

export { RunReportChart };
