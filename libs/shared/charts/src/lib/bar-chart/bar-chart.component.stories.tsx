/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import type { Meta, StoryObj } from '@storybook/react';

import { BarChart } from './bar-chart.component';

const meta: Meta<typeof BarChart> = {
	component: BarChart,
	title: 'charts/Bar Chart'
};
export default meta;
type Story = StoryObj<typeof BarChart>;

export const Primary = {
	args: {
		title: ''
	}
} satisfies Story;
