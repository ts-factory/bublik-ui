/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { StoryFn, Meta } from '@storybook/react';
import { FlowMap } from './flow-map';

export default {
	component: FlowMap,
	title: 'help/Flow Map',
	parameters: { layout: 'padded' }
} as Meta<typeof FlowMap>;

const Template: StoryFn<typeof FlowMap> = (args) => {
	return (
		<div className="flex h-screen">
			<FlowMap {...args} />
		</div>
	);
};

export const Primary = {
	render: Template,
	args: {}
};
