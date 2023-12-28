/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import type { Meta, StoryFn, StoryObj } from '@storybook/react';

import { Alert } from './alert.component';

import { within } from '@storybook/testing-library';
import { expect } from '@storybook/jest';
import { withBackground } from '../storybook-bg';

const meta: Meta<typeof Alert.Root> = {
	component: Alert.Root,
	title: 'components/Alert',
	decorators: [withBackground]
};
export default meta;
type Story = StoryObj<typeof Alert.Root>;

const Template: StoryFn<typeof Alert.Root> = (args) => {
	return (
		<Alert.Root {...args} className="flex flex-col gap-2">
			<Alert.Title>Title</Alert.Title>
			<Alert.Description>Something went wrong!</Alert.Description>
		</Alert.Root>
	);
};

export const Primary: Story = {
	render: Template,
	args: {
		type: 'error',
		size: 'default'
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		expect(canvas.getByText(/Welcome to Root!/gi)).toBeTruthy();
	}
};
