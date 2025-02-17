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
import { usePlatformSpecificCtrl } from '@/shared/hooks';

const ParamsSchema = z
	.object({ seriesIndex: z.number(), dataIndex: z.number() })
	.nonstrict();

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
			name:
				chart.series_label === null && chart.data.length === 1
					? chart.axis_y.label
					: d.series,
			type: 'line',
			data: d.points.map((d) => d?.[chart.axis_y.key]),
			itemStyle: {
				color: (params: unknown) => {
					const parsedParams = ParamsSchema.safeParse(params);
					if (!parsedParams.success) return '#65cd84';

					const point = d.points[parsedParams.data.dataIndex];
					const status = point?.metadata?.result_type?.toLowerCase();

					if (status === 'failed') return '#f95c78';
					return '#65cd84';
				}
			},
			symbol: (_, params: unknown) => {
				const parsedParams = ParamsSchema.safeParse(params);
				if (!parsedParams.success) return 'circle';

				const point = d.points[parsedParams.data.dataIndex];
				const status = point?.metadata?.result_type?.toLowerCase();

				if (status === 'failed') return 'diamond';
				return 'circle';
			},
			symbolSize: (_, params: unknown) => {
				const parsedParams = ParamsSchema.safeParse(params);
				if (!parsedParams.success) return 8;

				const point = d.points[parsedParams.data.dataIndex];
				const status = point?.metadata?.result_type?.toLowerCase();

				if (status === 'failed') return 16;
				return 8;
			}
		}));
	}, [chart.axis_y.key, chart.axis_y.label, chart.data, chart.series_label]);

	const chartRef = useRef<ReactEChartsCore>(null);

	useEffect(() => {
		const instance = chartRef.current?.getEchartsInstance();
		if (!instance) return;

		function handleClick(rawParams: unknown) {
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
	}, [chart.data]);

	const isPressed = usePlatformSpecificCtrl();
	const dataZoom = [{}, { type: 'inside', zoomLock: !isPressed }];

	useEffect(() => {
		function handleResize() {
			chartRef.current?.getEchartsInstance().resize();
		}

		window.addEventListener('resize', handleResize);
		return () => {
			window.removeEventListener('resize', handleResize);
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
			<div className="w-full flex flex-col gap-2 h-full pb-2">
				<Plot
					ref={chartRef}
					notMerge={false}
					options={{
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
							data: chart.data.map((s) => s.series),
							show: Boolean(chart.series_label),
							padding: chart.series_label ? [25, 0, 0, 0] : undefined
						},
						grid: {
							containLabel: true,
							top:
								Boolean(chart.series_label) && chart.data.length >= 4
									? '28%'
									: '15%',
							right: '7%',
							left: '5%',
							bottom: '20%'
						},
						dataZoom,
						xAxis: {
							type: 'category',
							name: chart.axis_x.label,
							nameLocation: 'middle',
							nameGap: 30,
							nameTextStyle: chartStyles.text,
							axisLabel: { ...chartStyles.text },
							data: chart.axis_x.values
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
					}}
					style={{ height: '100%' }}
				/>
			</div>
		</>
	);
}

export { RunReportChart };
