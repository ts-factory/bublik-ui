/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { cva } from '@/shared/tailwind-ui';

export const headerRowStyles = cva({
	base: 'h-8.5 bg-white flex'
});

export const headerCellStyles = cva({
	base: ['text-[0.6875rem] font-semibold', 'flex items-center justify-start']
});

export const bodyRowStyles = cva({
	base: 'h-8.5 flex rounded-md',
	variants: {
		isRowError: { true: 'bg-bg-fillError', false: 'bg-white' },
		isExpanded: { true: 'rounded-t-md', false: 'rounded-md' }
	}
});

export const bodyRowWrapperStyles = cva({
	base: [
		'relative border border-white hover:border-primary transition-colors rounded-md'
	],
	variants: { isExpanded: { true: 'border-primary' } }
});

export const bodyCellStyles = cva({
	base: ['text-[0.75rem] font-medium leading-[1.125rem]', 'flex items-center'],
	variants: { isRowError: { true: 'bg-[#ffc3c3]', false: 'bg-white' } }
});
