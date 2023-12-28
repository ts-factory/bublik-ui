/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Meta, StoryObj } from '@storybook/react';

import { withBackground } from '@/shared/tailwind-ui';

import {
	HistoryLegendCount,
	HistoryLegendCountLoading
} from './history-legend-count.component';

const Story: Meta<typeof HistoryLegendCount> = {
	component: HistoryLegendCount,
	title: 'history/Legend Count',
	parameters: { layout: 'centered' },
	decorators: [withBackground]
};
export default Story;

type Story = StoryObj<typeof HistoryLegendCount>;
export const Primary: Story = {
	args: {
		results: 0,
		runs: 0,
		iterations: 0,
		unexpected: 0,
		expected: 0
	}
};

export const Loading = () => <HistoryLegendCountLoading />;
