/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Meta, StoryFn } from '@storybook/react';

import { withBackground } from '@/shared/tailwind-ui';

import { HistoryRefresh } from './history-refresh.component';

const Story: Meta<typeof HistoryRefresh> = {
	component: HistoryRefresh,
	title: 'history/Refresh',
	parameters: { layout: 'centered' },
	decorators: [withBackground]
};
export default Story;

export const Primary = {
	args: {}
};
