/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Meta } from '@storybook/react';

import { withBackground } from '@/shared/tailwind-ui';

import { HistoryGlobalSearchFormButton } from './history-global-search-button.component';

const Story: Meta<typeof HistoryGlobalSearchFormButton> = {
	component: HistoryGlobalSearchFormButton,
	title: 'history/Global Search Form Button',
	parameters: { layout: 'centered' },
	decorators: [withBackground]
};
export default Story;

export const Primary = {
	args: {}
};
