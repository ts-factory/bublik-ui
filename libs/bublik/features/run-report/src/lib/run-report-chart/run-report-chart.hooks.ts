import { RefObject, useState } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';

import { ChartState } from '@/shared/charts';
import { ReportChart } from '@/shared/types';

import { resolveRunReportChartOptions } from './run-report-chart.utils';

interface UseRunReportChartStateOptions {
	chart: ReportChart;
	chartRef: RefObject<ReactEChartsCore>;
	isCtrlPressed: boolean;
	isFullScreen: boolean;
	idx: number;
}

function useRunReportChartState(options: UseRunReportChartStateOptions) {
	const { chartRef, chart, isCtrlPressed, isFullScreen, idx } = options;
	const [state, setState] = useState<ChartState>({
		isGlobalZoomEnabled: false,
		isFullScreen: false,
		isSlidersVisible: true,
		limitYAxis: false,
		mode: 'line'
	});

	function changeMode(type: string) {
		if (!type || type === state.mode) return;

		chartRef.current?.getEchartsInstance().setOption({ series: [{ type }] });
		setState((o) => ({ ...o, mode: type }));
	}

	function resetZoom() {
		const instance = chartRef.current?.getEchartsInstance();

		if (!instance) return;

		instance.dispatchAction({ type: 'dataZoom', start: 0, end: 100 });
	}

	function toggleGlobalZoom() {
		const instance = chartRef.current?.getEchartsInstance();

		if (!instance) return;

		if (!state.isGlobalZoomEnabled) {
			instance.dispatchAction({
				type: 'takeGlobalCursor',
				key: 'dataZoomSelect',
				dataZoomSelectActive: true
			});
		} else {
			instance.dispatchAction({
				type: 'takeGlobalCursor',
				key: 'dataZoomSelect',
				dataZoomSelectActive: false
			});
		}

		setState((o) => ({ ...o, isGlobalZoomEnabled: !o.isGlobalZoomEnabled }));
	}

	function toggleSliders() {
		const instance = chartRef.current?.getEchartsInstance();
		if (!instance) return;

		const newState = { ...state, isSlidersVisible: !state.isSlidersVisible };
		setState(newState);

		instance.setOption(
			resolveRunReportChartOptions({
				chart,
				isCtrlPressed,
				state,
				isFullScreen,
				idx
			}),
			true
		);
	}

	function toggleFullScreen(open?: boolean) {
		setState((o) => ({ ...o, isFullScreen: open ?? !o.isFullScreen }));
	}

	function toggleLimitYAxis() {
		setState((o) => ({ ...o, limitYAxis: !o.limitYAxis }));
	}

	return {
		toggleFullScreen,
		toggleGlobalZoom,
		toggleLimitYAxis,
		toggleSliders,
		resetZoom,
		changeMode,
		state
	};
}

export { useRunReportChartState };
