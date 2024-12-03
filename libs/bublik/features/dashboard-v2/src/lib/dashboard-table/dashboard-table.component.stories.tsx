/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { StoryObj, Meta } from '@storybook/react';
import { withRouter } from 'storybook-addon-remix-react-router';

import { DashboardTable } from './dashboard-table.component';

export default {
	component: DashboardTable,
	title: 'dashboard/Table',
	parameters: { layout: 'padded' },
	decorators: [withRouter]
} satisfies Meta<typeof DashboardTable>;

type Story = StoryObj<typeof DashboardTable>;

export const Row = {
	args: {
		rows: [],
		headers: [],
		context: {},
		layout: 'row',
		date: new Date(),
		isFetching: false,
		globalFilter: undefined
	}
} satisfies Story;

export const Columns = {
	args: {
		...Row.args,
		layout: 'column'
	}
} satisfies Story;
