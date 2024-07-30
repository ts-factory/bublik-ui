/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import type { Meta, StoryFn, StoryObj } from '@storybook/react';

import { withSidebar } from '@/shared/tailwind-ui';

import { HistoryError } from '../history-error';
import { PlotList, PlotListLoading } from './plot-list.component';

const Story: Meta<typeof PlotList> = {
	title: 'history/Plot List',
	component: PlotList,
	parameters: { layout: 'padded' },
	decorators: [withSidebar(true)]
};
export default Story;

const Template: StoryFn<typeof PlotList> = (args) => <PlotList {...args} />;

type Story = StoryObj<typeof PlotList>;

export const Primary: Story = {
	render: Template,
	args: { plots: [] }
};

export const Loading = () => <PlotListLoading />;
export const Error = () => <HistoryError error={{ status: 404 }} />;
