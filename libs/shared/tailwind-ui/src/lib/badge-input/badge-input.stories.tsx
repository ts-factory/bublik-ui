/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useState } from 'react';
import { StoryFn, Meta } from '@storybook/react';

import { BadgeInput, BadgeInputProps } from './badge-input';
import { withBackground } from '../storybook-bg';
import { BadgeItem } from './types';

export default {
	component: BadgeInput,
	title: 'form/Badge Input',
	decorators: [withBackground]
} as Meta<typeof BadgeInput>;

const Template: StoryFn<BadgeInputProps> = (args) => {
	const [badges, setBadges] = useState<BadgeItem[]>([
		{ id: 'badge-1', value: 'badge-1' },
		{ id: 'badge-2', value: 'badge-2' },
		{ id: 'badge-3', value: 'badge-3' },
		{ id: 'badge-4', value: 'badge-4' },
		{ id: 'badge-5', value: 'badge-5' },
		{ id: 'badge-6', value: 'badge-6' },
		{ id: 'badge-7', value: 'badge-7' }
	]);

	return (
		<div className="w-[450px]">
			<BadgeInput
				label="Badge"
				badges={badges}
				onBadgesChange={(badges) => setBadges(badges)}
			/>
		</div>
	);
};

export const Primary = {
	render: Template,
	args: {}
};
