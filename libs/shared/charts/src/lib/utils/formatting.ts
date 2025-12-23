/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { SingleMeasurementChart } from '@/services/bublik-api';
import { upperCaseFirstLetter } from '@/shared/utils';

export const formatLabel = (label: string) => {
	return label.split('_').map(upperCaseFirstLetter).join(' ');
};

export const getChartName = (plot: SingleMeasurementChart): string => {
	return plot.title
		? `${plot.title} - ${plot.axis_y.label}`
		: plot.subtitle ?? '';
};
