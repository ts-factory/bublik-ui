import { useNavigate, useSearchParams } from 'react-router-dom';
import {
	useQueryParam,
	NumericArrayParam,
	withDefault
} from 'use-query-params';

import { SingleMeasurementChart } from '@/services/bublik-api';
import { MeasurementsMode } from '@/shared/types';

const SELECTED_CHARTS_KEY = 'selectedCharts';

function useResultSelectCharts() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const [selectedCharts = [], setSelectedCharts] = useQueryParam(
		SELECTED_CHARTS_KEY,
		withDefault(NumericArrayParam, [])
	);

	const handleOpenButtonClick = () => {
		const nextParams = new URLSearchParams(searchParams);
		nextParams.set('mode', MeasurementsMode.Overlay);
		navigate({ search: nextParams.toString() });
	};

	function addChart(chartId: number) {
		setSelectedCharts((prev) => [...(prev || []), chartId]);
	}

	function removeChart(chartId: number) {
		setSelectedCharts((prev) => (prev || []).filter((id) => id !== chartId));
	}

	function resetCharts() {
		setSelectedCharts([]);
	}

	function handleChartClick(plot: SingleMeasurementChart) {
		if (selectedCharts.includes(plot.id)) {
			removeChart(plot.id);
		} else {
			addChart(plot.id);
		}
	}

	return {
		selectedCharts,
		addChart,
		removeChart,
		resetCharts,
		handleChartClick,
		handleOpenButtonClick
	};
}

export { useResultSelectCharts };
