/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Meta, StoryObj } from '@storybook/react';

import { BadgesHeaderInput } from './badge-header-input';
import { withBackground } from '../storybook-bg';

export default {
	component: BadgesHeaderInput,
	title: 'form/Badge Header',
	decorators: [withBackground]
} as Meta;

type Story = StoryObj<typeof BadgesHeaderInput>;
export const Primary: Story = {
	args: { value: ['1', '2'] }
};
