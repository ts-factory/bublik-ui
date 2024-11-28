/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { ComponentProps, useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import ReactEChartsCore from 'echarts-for-react/lib/core';

import { Plot, chartStyles } from '@/shared/charts';
import { ReportChart } from '@/shared/types';
import { LogPreviewContainer } from '@/bublik/features/log-preview-drawer';

interface RunReportChartProps {
	chart: ReportChart;
}

function RunReportChart(props: RunReportChartProps) {
	const { chart } = props;
	const { runId } = useParams<{ runId: string }>();
	const [resultId, setResultId] = useState<number>();
	const [open, setOpen] = useState(false);

	const series = useMemo<
		ComponentProps<typeof Plot>['options']['series']
	>(() => {
		return chart.data.map((d) => ({
			name: d.series,
			type: 'line',
			data: d.points.map((d) => d[chart.axis_y.key])
		}));
	}, []);

	const chartRef = useRef<ReactEChartsCore>(null);

	useEffect(() => {
		const instance = chartRef.current?.getEchartsInstance();
		if (!instance) return;

		function handleClick(rawParams: unknown) {
			const ParamsSchema = z
				.object({
					seriesIndex: z.number(),
					dataIndex: z.number()
				})
				.nonstrict();

			const paramsResult = ParamsSchema.safeParse(rawParams);
			if (!paramsResult.success) {
				toast.error('Failed to parse point data!');
				return;
			}

			const params = paramsResult.data;

			const meta =
				chart.data[params.seriesIndex].points[params.dataIndex].metadata;

			if (!meta?.result_id) {
				toast.error('No result id found in metadata for point!');
				return;
			}

			setResultId(meta?.result_id);
			setOpen(true);
		}

		instance.on('click', handleClick);
		return () => {
			instance.off('click', handleClick);
		};
	}, []);

	return (
		<>
			<LogPreviewContainer
				runId={Number(runId)}
				resultId={resultId}
				measurementId={resultId}
				open={open}
				onOpenChange={setOpen}
			/>
			<div className="w-full flex flex-col gap-2">
				<Plot
					ref={chartRef}
					options={{
						toolbox: { top: 9999, feature: { dataZoom: {} } },
						tooltip: {
							trigger: 'axis',
							textStyle: chartStyles.text,
							extraCssText: 'shadow-popover rounded-lg',
							axisPointer: { type: 'shadow' }
						},
						legend: { data: chart.data.map((s) => s.series) },
						grid: { containLabel: true, top: '30%' },
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
		</>
	);
}

export { RunReportChart };
