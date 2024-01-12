/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Meta } from '@storybook/react';

import { withBackground } from '@/shared/tailwind-ui';

import { HistorySubstringFilter } from './history-substring-filter.component';

const Story: Meta<typeof HistorySubstringFilter> = {
	component: HistorySubstringFilter,
	title: 'history/Substring filter',
	parameters: { layout: 'centered' },
	decorators: [withBackground]
};
export default Story;

export const Primary = {
	args: {}
};
