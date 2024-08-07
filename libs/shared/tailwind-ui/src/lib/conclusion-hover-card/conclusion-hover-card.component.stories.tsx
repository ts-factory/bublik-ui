/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import type { Meta, StoryFn, StoryObj } from '@storybook/react';
import { RUN_STATUS } from '@/shared/types';

import { ConclusionHoverCard } from './conclusion-hover-card.component';

import { withBackground } from '../storybook-bg';

const meta: Meta<typeof ConclusionHoverCard> = {
	component: ConclusionHoverCard,
	title: 'components/ConclusionHoverCard',
	decorators: [withBackground]
};
export default meta;
type Story = StoryObj<typeof ConclusionHoverCard>;

const Template: StoryFn<typeof ConclusionHoverCard> = (args) => {
	return (
		<ConclusionHoverCard {...args}>
			<div>Hover</div>
		</ConclusionHoverCard>
	);
};

export const Primary: Story = {
	render: Template,
	args: {
		conclusion: RUN_STATUS.Compromised,
		conclusionReason: 'Run is marked as compromised'
	}
};
