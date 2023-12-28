/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { StoryFn, Meta } from '@storybook/react';

import { ConnectionStatus } from './connection-status';

export default {
	component: ConnectionStatus,
	title: 'components/Connection Status'
} as Meta<typeof ConnectionStatus>;

const Template: StoryFn<typeof ConnectionStatus> = (args) => (
	<div className="relative w-screen h-screen">
		<ConnectionStatus {...args} />
	</div>
);

export const Primary = {
	render: Template,

	args: {
		isOnline: false
	}
};
