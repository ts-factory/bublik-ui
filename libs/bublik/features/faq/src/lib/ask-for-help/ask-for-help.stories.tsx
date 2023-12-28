/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Meta } from '@storybook/react';
import { AskForHelp } from './ask-for-help';

export default {
	component: AskForHelp,
	title: 'help/Ask For Help'
} as Meta<typeof AskForHelp>;

export const Primary = {
	args: {
		contactEmail: 'name@example.com'
	}
};
