/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { StoryFn, Meta } from '@storybook/react';
import { TableHeader } from './tables-header';

export default {
	component: TableHeader,
	title: 'charts/Table Header',
	parameters: { layout: 'padded' }
} as Meta<typeof TableHeader>;

const Template: StoryFn<typeof TableHeader> = (args) => (
	<div className="bg-white rounded-t-md">
		<TableHeader {...args} />
	</div>
);

export const Primary = {
	render: Template,
	args: {}
};
