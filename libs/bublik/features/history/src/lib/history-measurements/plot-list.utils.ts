/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { MeasurementPlot } from '@/shared/types';

export const isDisabledForCombined = (
	plot: MeasurementPlot,
	selectedPlots: MeasurementPlot[]
): boolean => {
	if (!selectedPlots.length) return false;

	const axisX = plot.dots.map((dot) => dot[plot.axises_config.default_x]);
	const selectedAxisX = selectedPlots[0].dots.map(
		(dot) => dot[selectedPlots[0].axises_config.default_x]
	);

	return !axisX.every((v, idx) => selectedAxisX[idx] === v);
};
