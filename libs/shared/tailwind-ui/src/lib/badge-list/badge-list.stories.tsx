/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { StoryFn, Meta } from '@storybook/react';
import { useState } from 'react';
import { BadgeList } from './badge-list';

export default {
	component: BadgeList,
	title: 'components/Badge List',
	decorators: [
		(Story) => <div className="p-4 bg-white rounded-md">{Story()}</div>
	]
} as Meta<typeof BadgeList>;

const initialSelected = ['badge-1'];

const Template: StoryFn<typeof BadgeList> = (args) => {
	const [selected, setSelected] = useState(initialSelected);

	return (
		<BadgeList
			{...args}
			selectedBadges={selected}
			onBadgeClick={(badge) => {
				selected.includes(badge.payload)
					? setSelected((selected) =>
							selected.filter((v) => v !== badge.payload)
					  )
					: setSelected((selected) => [...selected, badge.payload]);
			}}
		/>
	);
};

export const Primary = {
	render: Template,

	args: {
		badges: [
			{ payload: 'badge-1' },
			{ payload: 'important-badge', isImportant: true },
			{ payload: 'badge-3' },
			{
				payload:
					'env={hello: 1111111111111111111111111111111111111111111111111111111}'
			}
		],
		selectedBadges: initialSelected
	}
};
