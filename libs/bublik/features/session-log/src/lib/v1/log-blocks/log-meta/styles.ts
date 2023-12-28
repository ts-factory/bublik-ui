/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { cva } from '@/shared/tailwind-ui';

export const urlStyles = cva({
	base: ['hover:underline', 'text-primary', 'text-xs']
});

export const textStyle = cva({
	base: ['text-text-primary', 'text-xs'],
	variants: { bold: { true: 'font-semibold' } }
});
