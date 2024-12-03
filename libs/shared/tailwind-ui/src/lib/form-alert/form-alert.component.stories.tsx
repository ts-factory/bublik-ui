/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import type { Meta, StoryFn, StoryObj } from '@storybook/react';
import { expect, within } from '@storybook/test';

import { FormAlert } from './form-alert.component';

import { withBackground } from '../storybook-bg';
import { Icon } from '../icon';

const meta: Meta<typeof FormAlert.Root> = {
	component: FormAlert.Root,
	title: 'components/FormAlert',
	decorators: [withBackground]
};
export default meta;
type Story = StoryObj<typeof FormAlert.Root>;

const Template: StoryFn<typeof FormAlert.Root> = (args) => {
	return (
		<FormAlert.Root {...args} className="flex flex-col gap-2">
			<div className="flex items-start gap-4">
				<FormAlert.Icon>
					<Icon name="TriangleExclamationMark" size={16} />
				</FormAlert.Icon>
				<div className="flex flex-col gap-2">
					<FormAlert.Title>Title</FormAlert.Title>
					<FormAlert.Description>Something went wrong!</FormAlert.Description>
				</div>
			</div>
		</FormAlert.Root>
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
		await expect(canvas.getByText(/Welcome to Root!/gi)).toBeTruthy();
	}
};
