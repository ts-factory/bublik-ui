/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { StoryFn, Meta, StoryObj } from '@storybook/react';

import {
	RpsPerThreadWorkMean,
	ThroughPutWorkMean,
	RpsPerThreadStdEv,
	mockPlot
} from './chart.mock';
import { Chart } from './chart';
import { withBackground } from '@/shared/tailwind-ui';

export default {
	component: Chart,
	title: 'charts/Chart',
	parameters: { layout: 'padded' },
	decorators: [withBackground]
} satisfies Meta<typeof Chart>;

const Template: StoryFn<typeof Chart> = (args) => {
	return <Chart {...args} />;
};

type Story = StoryObj<typeof Chart>;

export const SingleValues = {
	render: Template,
	args: {
		id: 'single',
		plot: mockPlot
	}
} satisfies Story;

export const StackedValues = {
	render: Template,
	args: {
		id: 'single',
		plots: [mockPlot, mockPlot]
	}
} satisfies Story;

export const SingleTime = {
	render: Template,
	args: {
		id: 'single',
		plot: RpsPerThreadStdEv
	}
} satisfies Story;

export const StackedTime = {
	render: Template,
	args: {
		id: 'stacked',
		plots: [ThroughPutWorkMean, RpsPerThreadWorkMean, RpsPerThreadStdEv]
	}
} satisfies Story;
