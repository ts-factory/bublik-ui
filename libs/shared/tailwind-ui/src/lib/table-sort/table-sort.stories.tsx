/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Meta } from '@storybook/react';

import { TableSort } from './table-sort';

export default {
	component: TableSort,
	title: 'components/Table Sort',
	decorators: [
		(Story) => <div className="p-4 bg-white rounded-md">{Story()}</div>
	]
} as Meta;

export const Primary = {
	args: {
		isSorted: true,
		isSortedDesc: false
	}
};
