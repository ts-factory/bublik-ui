/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { SingleMeasurementChart } from '@/services/bublik-api';

function isDisabledForCombined(
	plot: SingleMeasurementChart,
	selectedPlots: SingleMeasurementChart[]
): boolean {
	if (!selectedPlots.length) return false;

	// Get x-axis values from dataset for current plot
	const axisX = plot.dataset.slice(1).map((row) => {
		const xIndex = plot.dataset[0].indexOf(plot.axis_x.key);
		return row[xIndex];
	});

	// Get x-axis values from dataset for first selected plot
	const selectedAxisX = selectedPlots[0].dataset.slice(1).map((row) => {
		const xIndex = selectedPlots[0].dataset[0].indexOf(
			selectedPlots[0].axis_x.key
		);
		return row[xIndex];
	});

	// Compare x-axis values to ensure they match
	return !axisX.every((v, idx) => selectedAxisX[idx] === v);
}

export { isDisabledForCombined };
export * from './actions';
export * from './table-utils';
export * from './colors';
export * from './formatting';
