/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import type { Meta, StoryObj } from '@storybook/react';

import { withBackground } from '@/shared/tailwind-ui';
import { DASHBOARD_MODE } from '@/shared/types';

import { ModePicker } from './mode-picker.component';

const meta: Meta<typeof ModePicker> = {
	component: ModePicker,
	title: 'dashboard/ Mode Picker',
	decorators: [withBackground]
};
export default meta;
type Story = StoryObj<typeof ModePicker>;

export const Primary = {
	args: {
		type: 'single',
		value: DASHBOARD_MODE.RowsLine
	}
} satisfies Story;
