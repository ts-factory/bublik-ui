/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { SingleMeasurementChart } from '@/services/bublik-api';
import { PointSchema } from '@/shared/types';
import { Point } from '@/shared/types';

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

function resolvePoint(
	plot: SingleMeasurementChart,
	dataIndex: number
): Point | null {
	const dimensions = plot.dataset?.[0];
	const row = plot.dataset?.[dataIndex + 1];

	if (!dimensions || !row) return null;

	const rawData = dimensions.reduce<Record<string, unknown>>(
		(acc, curr, idx) => {
			acc[curr] = row[idx];
			return acc;
		},
		{}
	);

	const result = PointSchema.safeParse(rawData);

	if (!result.success) return null;

	return result.data;
}

export { isDisabledForCombined, resolvePoint };
