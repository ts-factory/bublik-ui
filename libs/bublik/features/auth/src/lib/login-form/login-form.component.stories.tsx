/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import type { Meta, StoryObj } from '@storybook/react';
import { withRouter } from 'storybook-addon-remix-react-router';
import { within, userEvent } from '@storybook/test';

import { LoginForm } from './login-form.component';

const Story = {
	component: LoginForm,
	title: 'auth/Login Form',
	decorators: [withRouter]
} satisfies Meta<typeof LoginForm>;
export default Story;

type Story = StoryObj<typeof LoginForm>;

export const Primary: Story = {
	args: {
		defaultValues: { email: '', password: '' }
	},
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement);
		await step('Enter email and password', async () => {
			await userEvent.type(canvas.getByLabelText(/email/i), 'test@example.com');
			await userEvent.type(canvas.getByLabelText(/password/i), 'password123');
		});

		await step('Submit form', async () => {
			await userEvent.click(canvas.getByRole('button'));
		});
	}
};
