/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import type { Meta, StoryObj } from '@storybook/react';
import { ResetPasswordForm } from './reset-password.component';
import { userEvent, within } from '@storybook/test';

const Story: Meta<typeof ResetPasswordForm> = {
	component: ResetPasswordForm,
	title: 'auth/Change Password Form'
};
export default Story;

type Story = StoryObj<typeof ResetPasswordForm>;
export const Primary = {
	args: {
		onSubmit: (form) => {
			console.log('SEND', form);
		}
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		await userEvent.type(canvas.getByLabelText(/code/i), '123456', {
			delay: 50
		});

		await userEvent.type(canvas.getByLabelText('Password'), 'secretPassword', {
			delay: 50
		});

		await userEvent.type(
			canvas.getByLabelText('Password Confirm'),
			'secretPassword',
			{
				delay: 50
			}
		);

		await userEvent.click(canvas.getByRole('button'));
	}
} satisfies Story;
