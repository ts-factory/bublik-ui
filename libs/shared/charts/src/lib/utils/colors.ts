/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { wrap } from '@/shared/utils';
import { twTheme } from '../tw-theme';

export const getColorByIdx = (idx: number) => {
	const colors = twTheme.theme.color;

	return colors[wrap(colors.length, idx)];
};
