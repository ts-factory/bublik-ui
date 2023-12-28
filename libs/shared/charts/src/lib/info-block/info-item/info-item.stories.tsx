/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { StoryFn, Meta } from '@storybook/react';
import { InfoItem } from './info-item';

export default {
	component: InfoItem,
	title: 'charts/Info Item'
} as Meta<typeof InfoItem>;

const Template: StoryFn<typeof InfoItem> = (args) => (
	<div className="p-4 bg-white rounded-md">
		<InfoItem {...args} />
	</div>
);

export const Primary = {
	render: Template,

	args: {
		label: 'Test name',
		value: 'app_rtt'
	}
};

export const Passed = {
	render: Template,

	args: {
		isError: false,
		label: 'Obtained result',
		value: 'PASSED'
	}
};

export const Failed = {
	render: Template,

	args: {
		isError: true,
		label: 'Obtained result',
		value: 'FAILED'
	}
};
