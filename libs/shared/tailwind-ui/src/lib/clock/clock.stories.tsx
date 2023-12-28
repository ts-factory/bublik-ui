/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { StoryObj, Meta } from '@storybook/react';

import { Clock, ClockProps } from './clock';
import { withBackground } from '../storybook-bg';

export default {
	component: Clock,
	title: 'dashboard/Clock',
	decorators: [withBackground]
} satisfies Meta<ClockProps>;

type Story = StoryObj<typeof Clock>;
export const Primary: Story = {
	args: { time: new Date() }
};
