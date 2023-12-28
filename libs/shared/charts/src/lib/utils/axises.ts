/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { format } from 'date-fns';

import {
	AxisConfig,
	AxisDescription,
	ChartAxis,
	MeasurementPlot,
	Point
} from '@/shared/types';

import { getChartName } from './formatting';
import { CHART_DATE_FORMAT } from '../constants';

export const formatChartDate = (date: string) =>
	format(new Date(date), CHART_DATE_FORMAT);

export const createAxis = (
	axisDescription: AxisDescription,
	points: Point[]
): ChartAxis => {
	const { getter, label, units } = axisDescription;

	return {
		label,
		values: points.map((point) => point[getter]),
		units
	};
};

export const getDefaultAxises = (config: AxisConfig, points: Point[]) => {
	const { default_x, default_y } = config;

	const axisX = createAxis(config.axises[default_x], points);
	const axisY = createAxis(config.axises[default_y], points);

	return { axisX, axisY } as const;
};

export const getChartAxises = (plot: MeasurementPlot) => {
	const title = getChartName(plot);
	const { axisX, axisY } = getDefaultAxises(plot.axises_config, plot.dots);

	return { axisX, axisY, title } as const;
};
