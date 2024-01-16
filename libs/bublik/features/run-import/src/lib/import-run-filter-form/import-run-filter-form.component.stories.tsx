/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import type { Meta } from '@storybook/react';

import { withBackground } from '@/shared/tailwind-ui';

import { ImportRunFilterForm } from './import-run-filter-form.component';

const Story: Meta<typeof ImportRunFilterForm> = {
	component: ImportRunFilterForm,
	title: 'import/Import Run Filter Form',
	argTypes: {
		onFiltersChange: { action: 'onFiltersChange executed!' }
	},
	decorators: [withBackground]
};
export default Story;

export const Primary = {
	args: {}
};
