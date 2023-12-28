/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import type { Meta, StoryObj } from '@storybook/react';
import { KeyList } from './key-list.component';
import { withBackground } from '@/shared/tailwind-ui';

const Story: Meta<typeof KeyList> = {
	component: KeyList,
	title: 'run/Key List',
	decorators: [withBackground]
};
export default Story;

type Story = StoryObj<typeof KeyList>;
export const Primary: Story = {
	args: {
		items: [
			{ name: 'NO-GENEVA', url: 'https://localhost:4200/v1' },
			{ name: 'NO-GENEVA', url: '' }
		]
	}
};

export const Url: Story = {
	args: {
		items: [{ name: 'NO-GENEVA', url: 'https://localchost:4200/1' }]
	}
};

export const Button: Story = {
	args: {
		items: [{ name: 'NO-GENEVA' }]
	}
};
