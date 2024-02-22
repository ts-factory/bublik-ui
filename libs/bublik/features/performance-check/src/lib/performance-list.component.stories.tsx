/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { Meta, StoryFn, StoryObj } from '@storybook/react';

import { withBackground } from '@/shared/tailwind-ui';

import {
	PerformanceList,
	PerformanceListEmpty,
	PerformanceListError,
	PerformanceListLoading
} from './performance-list.component';

const meta = {
	title: 'performance/Performance List',
	decorators: [
		withBackground,
		(story) => <div className={'min-w-[400px]'}>{story()}</div>
	]
} satisfies Meta<typeof PerformanceList>;
export default meta;

type Story = StoryObj<typeof PerformanceList>;

const Template: StoryFn<typeof PerformanceList> = (args) => (
	<PerformanceList {...args} />
);

export const Primary = {
	render: Template,
	args: {
		urls: [
			{
				label: 'Google',
				url: 'https://www.google.com/',
				timeout: 1
			},
			{
				label: 'GitHub',
				url: 'https://github.com/',
				timeout: 10
			},
			{
				label: 'Amazon',
				url: 'https://www.amazon.com/',
				timeout: 10
			},
			{
				label: 'Facebook',
				url: 'https://www.facebook.com/',
				timeout: 10
			},
			{
				label: 'Twitter',
				url: 'https://twitter.com/',
				timeout: 10
			},
			{
				label: 'LinkedIn',
				url: 'https://www.linkedin.com/',
				timeout: 10
			},
			{
				label: 'Wikipedia',
				url: 'https://www.wikipedia.org/',
				timeout: 10
			},
			{
				label: 'Netflix',
				url: 'https://www.netflix.com/',
				timeout: 10
			}
		]
	}
} satisfies Story;

export const Loading = {
	render: () => <PerformanceListLoading />
} satisfies Story;

export const Empty = {
	render: () => <PerformanceListEmpty />
} satisfies Story;

export const Error = {
	render: () => <PerformanceListError error={{ status: 404 }} />
} satisfies Story;
