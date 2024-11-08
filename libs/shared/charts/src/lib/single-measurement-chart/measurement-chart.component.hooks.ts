import { RefObject, useEffect, useState } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';

import { SingleMeasurementChart } from '@/services/bublik-api';

import {
	ChartState,
	resolveOptions
} from './measurement-chart.component.utils';
import { ECElementEvent } from 'echarts';

interface UseChartStateProps {
	chart: SingleMeasurementChart;
	chartRef: RefObject<ReactEChartsCore>;
	color: string;
}

const DEFAULT_STATE: ChartState = {
	mode: 'line',
	isGlobalZoomEnabled: false,
	isSlidersVisible: false,
	isFullScreen: false
};

function useChartState(props: UseChartStateProps) {
	const { chart, chartRef, color } = props;
	const [state, setState] = useState<ChartState>(DEFAULT_STATE);

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

		instance.setOption(resolveOptions(chart, newState, { color }), true);
	}

	function toggleFullScreen(open?: boolean) {
		setState((o) => ({ ...o, isFullScreen: open ?? !o.isFullScreen }));
	}

	return {
		state,
		changeMode,
		resetZoom,
		toggleGlobalZoom,
		toggleSliders,
		toggleFullScreen
	};
}

interface UseChartClickProps {
	ref: RefObject<ReactEChartsCore>;
	onChartPointClick?: (props: {
		componentIndex: number;
		dataIndex: number;
	}) => void;
}

function useChartClick(props: UseChartClickProps) {
	const { ref, onChartPointClick } = props;

	useEffect(() => {
		const instance = ref.current?.getEchartsInstance();

		if (!instance) return;

		const resize = () => instance.resize();
		const handleChartClick = (props: ECElementEvent) => {
			const { componentIndex, dataIndex } = props;

			onChartPointClick?.({ componentIndex, dataIndex });
		};

		instance.on('click', handleChartClick);
		window.addEventListener('resize', resize);
		return () => {
			window.removeEventListener('resize', resize);
		};
	}, [onChartPointClick, ref]);
}

export { useChartState, useChartClick };
