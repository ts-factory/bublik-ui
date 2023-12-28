/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Meta, StoryObj } from '@storybook/react';

import { RunProgress } from './run-progress.component';

export default {
	component: RunProgress,
	title: 'dashboard/Run Progress',
	parameters: { layout: 'padded' },
	decorators: [
		(Story) => <div className="p-4 bg-white rounded-md">{Story()}</div>
	]
} as Meta<typeof RunProgress>;

type Story = StoryObj<typeof RunProgress>;
export const Primary = {
	args: {
		data: [true, false, true, false, false, true, true],
		isError: false,
		isLoading: false
	}
} satisfies Story;

export const Loading = {
	args: { isLoading: true }
} satisfies Story;

export const Error = {
	args: { isError: true }
} satisfies Story;
