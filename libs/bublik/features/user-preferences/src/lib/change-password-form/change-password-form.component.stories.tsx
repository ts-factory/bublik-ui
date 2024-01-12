/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import type { Meta, StoryObj } from '@storybook/react';

import { withBackground } from '@/shared/tailwind-ui';

import { ChangePasswordForm } from './change-password-form.component';

const meta: Meta<typeof ChangePasswordForm> = {
	component: ChangePasswordForm,
	title: 'auth/Change User Password Form',
	argTypes: { onSubmit: { action: 'onSubmit executed!' } },
	decorators: [withBackground]
};
export default meta;

type Story = StoryObj<typeof ChangePasswordForm>;

export const Primary = {
	args: {}
};

export const Heading: Story = {
	args: {},
	play: async ({ canvasElement }) => {
		// const canvas = within(canvasElement);
	}
};
