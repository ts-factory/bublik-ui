/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { MeasurementPlot } from '@/shared/types';
import { upperCaseFirstLetter } from '@/shared/utils';

export const formatLabel = (label: string) => {
	return label.split('_').map(upperCaseFirstLetter).join(' ');
};

export const getChartName = (plot: MeasurementPlot): string => {
	return `${plot.type} - ${plot.axises_config.title}`;
};
