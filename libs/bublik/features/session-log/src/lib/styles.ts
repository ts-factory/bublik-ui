/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { cva } from '@/shared/tailwind-ui';

export const urlStyles = cva(['hover:underline', 'text-primary']);

export const textStyle = cva([
	'text-text-primary',
	'text-[0.75rem]',
	'leading-[0.875rem]'
]);
