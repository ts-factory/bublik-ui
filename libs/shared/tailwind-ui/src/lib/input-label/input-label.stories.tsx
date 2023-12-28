/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { StoryFn, Meta } from '@storybook/react';
import { InputLabel, InputLabelProps } from './input-label';

export default {
	component: InputLabel,
	title: 'form/Label',
	decorators: [
		(Story) => <div className="p-4 bg-white rounded-md">{Story()}</div>
	]
} as Meta;

const Template: StoryFn<InputLabelProps> = (args) => (
	<InputLabel {...args}>Test Label</InputLabel>
);

export const Primary = {
	render: Template,
	args: {}
};
