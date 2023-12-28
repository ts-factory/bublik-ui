/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import React from 'react';
import { StoryFn, Meta } from '@storybook/react';

import { Badge, BadgeVariants } from './badge';

export default {
	component: Badge,
	title: 'components/Badge',
	decorators: [
		(Story) => (
			<div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-md">
				{Story()}
			</div>
		)
	]
} as Meta<typeof Badge>;

const SingleTemplate: StoryFn<typeof Badge> = (args) => (
	<Badge {...args}>Badge</Badge>
);

const MultipleTemplate: StoryFn<typeof Badge> = (args) => {
	return (
		<React.Fragment>
			<Badge {...args} variant={BadgeVariants.Primary}>
				Primary
			</Badge>
			<Badge {...args} variant={BadgeVariants.PrimaryActive}>
				Primary Active
			</Badge>
			<Badge {...args} variant={BadgeVariants.Expected}>
				Expected
			</Badge>
			<Badge {...args} variant={BadgeVariants.ExpectedActive}>
				Expected Active
			</Badge>
			<Badge {...args} variant={BadgeVariants.Unexpected}>
				Unexpected
			</Badge>
			<Badge {...args} variant={BadgeVariants.UnexpectedActive}>
				Unexpected Active
			</Badge>
			<Badge {...args} variant={BadgeVariants.Transparent}>
				Transparent
			</Badge>
		</React.Fragment>
	);
};

export const Primary = {
	render: SingleTemplate,
	args: { variant: BadgeVariants.Primary, isSelected: false }
};

export const All = {
	render: MultipleTemplate,
	args: { isSelected: false }
};

export const Custom = {
	render: SingleTemplate,
	args: {
		isSelected: false,
		className: 'bg-badge-16'
	}
};
