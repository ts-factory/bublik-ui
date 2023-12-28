/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import type { Meta, StoryObj } from '@storybook/react';

import * as Icons from '@/icons';

import { Icon } from './icon';
import { withBackground } from '../storybook-bg';

const Story: Meta<typeof Icon> = {
	component: Icon,
	title: 'components/Icon',
	decorators: [withBackground]
};
export default Story;

type Story = StoryObj<typeof Icon>;
export const Primary: Story = {
	args: { name: 'Bulb' }
};

export const AllIcons = () => {
	return (
		<div className="p-4 bg-white rounded-md">
			<div className="flex flex-wrap items-center justify-between gap-4">
				{Object.entries(Icons).map(([name, Icon]) => (
					<div className="flex flex-col items-center justify-center">
						<Icon key={name} width={24} height={24} />
						<span className="">{name}</span>
					</div>
				))}
			</div>
		</div>
	);
};
