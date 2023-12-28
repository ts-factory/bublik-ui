/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { StoryFn, Meta, StoryObj } from '@storybook/react';

import { HistoryError } from './history-error';

const Story: Meta<typeof HistoryError> = {
	component: HistoryError,
	title: 'history/Error',
	decorators: []
};
export default Story;

type Story = StoryObj<typeof HistoryError>;
export const Primary: Story = {
	args: { error: { status: 404 } }
};
