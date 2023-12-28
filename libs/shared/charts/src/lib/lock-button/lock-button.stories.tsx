/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { StoryFn, Meta } from '@storybook/react';
import { LockButton } from './lock-button';

export default {
	component: LockButton,
	title: 'charts/Lock Button',
	decorators: [
		(Story) => <div className="p-4 bg-white rounded-md">{Story()}</div>
	]
} as Meta<typeof LockButton>;

export const Primary = {
	args: {
		isLockedMode: false
	}
};
