/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within } from '@storybook/testing-library';

import { ForgotPasswordForm } from './forgot-password.component';

const Story: Meta<typeof ForgotPasswordForm> = {
	component: ForgotPasswordForm,
	title: 'auth/Forgot Password Form'
};
export default Story;

type Story = StoryObj<typeof ForgotPasswordForm>;
export const Primary = {
	args: {
		onSubmit: (form) => {
			console.log('SEND', form);
		}
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		await userEvent.type(canvas.getByLabelText(/email/i), 'jogn@example.com', {
			delay: 50
		});

		await userEvent.click(canvas.getByRole('button'));
	}
} satisfies Story;
