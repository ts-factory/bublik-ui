/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import type { Meta, StoryObj } from '@storybook/react';

import { withBackground } from '@/shared/tailwind-ui';

import { AutoReloadToggle } from './auto-reload.component';

const meta: Meta<typeof AutoReloadToggle> = {
	component: AutoReloadToggle,
	title: 'dashboard/Auto Reload Toggle',
	decorators: [withBackground]
};
export default meta;
type Story = StoryObj<typeof AutoReloadToggle>;

export const Primary = {
	args: {}
} satisfies Story;
