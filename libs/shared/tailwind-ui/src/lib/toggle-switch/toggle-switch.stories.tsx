/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Meta, StoryObj } from '@storybook/react';

import { ToggleSwitch } from './toggle-switch';

export default {
	component: ToggleSwitch,
	title: 'components/Toggle Switch',
	decorators: [
		(Story) => <div className="p-4 bg-white rounded-md">{Story()}</div>
	]
} as Meta<typeof ToggleSwitch>;

type Story = StoryObj<typeof ToggleSwitch>;
export const Primary: Story = {
	args: {
		label: 'Switch Label'
	}
};
