/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { StoryFn, Meta, StoryObj } from '@storybook/react';

import { Skeleton } from './skeleton';
import { withBackground } from '../storybook-bg';

export default {
	component: Skeleton,
	title: 'components/Skeleton',
	decorators: [withBackground]
} satisfies Meta<typeof Skeleton>;

const Template: StoryFn<typeof Skeleton> = (args) => (
	<div className="flex items-center space-x-4">
		<Skeleton className="w-12 h-12 rounded-full" />
		<div className="space-y-2">
			<Skeleton className="rounded-md h-4 w-[250px]" />
			<Skeleton className="rounded-md h-4 w-[200px]" />
		</div>
	</div>
);

type Story = StoryObj<typeof Skeleton>;

export const Primary: Story = {
	render: Template,
	args: {}
};
