/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { twMerge } from 'tailwind-merge';
import { ClassValue, clsx } from 'clsx';
import { defineConfig } from 'cva';

export type { VariantProps } from 'cva';

export * from './run-info-helpers';
export * from './test-utils';
export { twMerge };
export { toast } from 'sonner';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const { cva, cx, compose } = defineConfig({
	hooks: {
		onComplete: (className) => twMerge(className)
	}
});
