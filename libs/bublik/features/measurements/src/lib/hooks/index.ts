import { useNavigate, useSearchParams } from 'react-router-dom';
import {
	useQueryParam,
	NumericArrayParam,
	withDefault
} from 'use-query-params';

import { SingleMeasurementChart } from '@/services/bublik-api';
import { resetSelectionPopoverOpenState } from '@/shared/tailwind-ui';
import { MeasurementsMode } from '@/shared/types';

const SELECTED_CHARTS_KEY = 'selectedCharts';
const MEASUREMENTS_SELECTED_CHARTS_POPOVER_STORAGE_KEY =
	'measurements-selected-charts-popover-open';

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

		if (selectedCharts.length === 1 && selectedCharts.includes(chartId)) {
			resetSelectionPopoverOpenState(
				MEASUREMENTS_SELECTED_CHARTS_POPOVER_STORAGE_KEY
			);
		}
	}

	function resetCharts() {
		resetSelectionPopoverOpenState(
			MEASUREMENTS_SELECTED_CHARTS_POPOVER_STORAGE_KEY
		);
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

export {
	MEASUREMENTS_SELECTED_CHARTS_POPOVER_STORAGE_KEY,
	useResultSelectCharts
};
