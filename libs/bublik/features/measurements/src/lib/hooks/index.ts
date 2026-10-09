/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useSearchWriter } from '@/router';
import { SingleMeasurementChart } from '@/services/bublik-api';
import { resetSelectionPopoverOpenState } from '@/shared/tailwind-ui';
import { MeasurementsMode } from '@/shared/types';

import { measurementsRoute, useSelectedChartIds } from '../route';

const MEASUREMENTS_SELECTED_CHARTS_POPOVER_STORAGE_KEY =
	'measurements-selected-charts-popover-open';

function useResultSelectCharts() {
	const navigate = measurementsRoute.useNavigate();
	const writeSearch = useSearchWriter();
	const selectedCharts = useSelectedChartIds();

	// `selectedCharts` is written as use-query-params' `replaceIn` did: merged
	// into the current search, the entry replaced, `location.state` kept.
	// An empty selection drops the key.
	const setSelectedCharts = (next: number[]) => {
		writeSearch({ selectedCharts: next.length ? next : undefined });
	};

	// A push to the overlay layout keeping every other key in place (`mode`
	// is appended when absent), the hash and `location.state` dropped, as
	// React Router's `navigate({ search })` did.
	const handleOpenButtonClick = () => {
		void navigate({
			search: (search) => ({ ...search, mode: MeasurementsMode.Overlay }),
			resetScroll: false
		});
	};

	function addChart(chartId: number) {
		setSelectedCharts([...selectedCharts, chartId]);
	}

	function removeChart(chartId: number) {
		setSelectedCharts(selectedCharts.filter((id) => id !== chartId));

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
