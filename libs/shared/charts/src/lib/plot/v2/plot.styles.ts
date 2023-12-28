/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
export const chartStyles = {
	text: {
		fontFamily: 'Inter',
		fontSize: 11,
		fontWeight: 500,
		lineHeight: 18
	}
};

export const chartHelper = {
	createTextStyle: () => ({}),
	createTooltip: () => ({}),
	createSeries: () => ({}),
	createLegend: () => ({})
} as const;
