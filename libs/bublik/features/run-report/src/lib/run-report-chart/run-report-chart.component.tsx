/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { ReactNode, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import ReactEChartsCore from 'echarts-for-react/lib/core';

import { MeasurementChartToolbar, Plot } from '@/shared/charts';
import { ReportChart } from '@/shared/types';
import { LogPreviewContainer } from '@/bublik/features/log-preview-drawer';
import { usePlatformSpecificCtrl } from '@/shared/hooks';
import { DrawerContent, DrawerRoot } from '@/shared/tailwind-ui';

import {
	ParamsSchema,
	resolveRunReportChartOptions
} from './run-report-chart.utils';
import { useRunReportChartState } from './run-report-chart.hooks';

interface RunReportChartProps {
	chart: ReportChart;
	isFullScreen?: boolean;
	stackedButton?: ReactNode;
}

function RunReportChart(props: RunReportChartProps) {
	const { chart, isFullScreen = false, stackedButton } = props;
	const { runId } = useParams<{ runId: string }>();
	const [resultId, setResultId] = useState<number>();
	const [open, setOpen] = useState(false);

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

	useEffect(() => {
		function handleResize() {
			chartRef.current?.getEchartsInstance().resize();
		}

		window.addEventListener('resize', handleResize);
		return () => {
			window.removeEventListener('resize', handleResize);
		};
	}, []);

	const isCtrlPressed = usePlatformSpecificCtrl();
	const {
		state,
		toggleGlobalZoom,
		resetZoom,
		toggleSliders,
		changeMode,
		toggleFullScreen,
		toggleLimitYAxis
	} = useRunReportChartState({ chart, chartRef, isCtrlPressed, isFullScreen });

	const options = resolveRunReportChartOptions({
		chart,
		state,
		isCtrlPressed,
		isFullScreen
	});

	return (
		<>
			<LogPreviewContainer
				runId={Number(runId)}
				resultId={resultId}
				measurementId={resultId}
				open={open}
				onOpenChange={setOpen}
			/>
			<DrawerRoot open={state.isFullScreen} onOpenChange={toggleFullScreen}>
				<DrawerContent className="w-[75vw] p-4">
					<RunReportChart chart={chart} isFullScreen={true} />
				</DrawerContent>
			</DrawerRoot>
			<div className="w-full flex flex-col gap-2 h-full pb-2">
				<div className="pr-12">
					<MeasurementChartToolbar
						title=""
						state={state}
						toggleGlobalZoom={toggleGlobalZoom}
						resetZoom={resetZoom}
						toggleSliders={toggleSliders}
						toggleLimitYAxis={toggleLimitYAxis}
						changeMode={changeMode}
						toggleFullScreen={toggleFullScreen}
						isFullScreen={isFullScreen}
						additionalToolBarItems={stackedButton}
					/>
				</div>
				<Plot
					ref={chartRef}
					notMerge={false}
					options={options}
					style={{ height: '100%' }}
				/>
			</div>
		</>
	);
}

export { RunReportChart };
