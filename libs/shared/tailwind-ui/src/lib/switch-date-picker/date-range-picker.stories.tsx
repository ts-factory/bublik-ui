/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import type { Meta, StoryObj } from '@storybook/react';

import { withBackground } from '../storybook-bg';
import { DateRangePicker } from './date-range-picker';

const Story: Meta<typeof DateRangePicker> = {
	component: DateRangePicker,
	title: 'components/Date Range Picker',
	decorators: [withBackground]
};
export default Story;

type Story = StoryObj<typeof DateRangePicker>;
export const Primary = {
	args: {}
} satisfies Story;
