/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import type { Meta } from '@storybook/react';
import { TwTable } from './tw-table';

const Story: Meta<typeof TwTable> = {
	component: TwTable,
	title: 'components/Table',
	parameters: { layout: 'padded' }
};
export default Story;

export const Primary = {
	args: {
		data: [{ name: 'John', age: 24 }],
		columns: [{ accessorKey: 'name', header: 'Name' }],
		classNames: {
			headerRow:
				'h-8 bg-white grid grid-cols-[24px,1fr,minmax(145px,1fr),minmax(365px,3.5fr),1.5fr,2fr,6fr]',
			headerCell:
				'text-[0.6875rem] font-semibold leading-[0.875rem] justify-start flex items-center',
			body: 'space-y-1 [&>:first-of-type]:mt-1',
			bodyRow:
				'overflow-hidden bg-white rounded-md [&>*:not(:first-of-type)]:py-2 [&>*:not(:first-of-type)]:px-1 grid grid-cols-[24px,1fr,minmax(145px,1fr),minmax(365px,3.5fr),1.5fr,2fr,6fr]'
		}
	}
};
