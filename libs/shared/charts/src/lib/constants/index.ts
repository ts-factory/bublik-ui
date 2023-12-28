/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
export const COLORS = [
	'#65cd84',
	'#7283e2',
	'#ffd645',
	'#f95c78',
	'#ff951c'
] as const;

interface MeasurementConfig {
	tableId: string;
}

export const MeasurementConfig: MeasurementConfig = {
	tableId: 'ChartTable'
};

export const CHART_DATE_FORMAT = 'yyyy.MM.dd / HH:mm:ss';
