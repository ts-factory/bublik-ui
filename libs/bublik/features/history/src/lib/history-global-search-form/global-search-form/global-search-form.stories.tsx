/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Meta } from '@storybook/react';

import { VERDICT_TYPE } from '@/shared/types';

import { withBackground } from '@/shared/tailwind-ui';
import { GlobalSearchForm } from './global-search-form.component';

export default {
	component: GlobalSearchForm,
	title: 'history/Global Search Form',
	decorators: [withBackground]
} as Meta<typeof GlobalSearchForm>;

export const Primary = {
	args: {
		initialValues: {
			testName: '',
			hash: '',
			parameters: [],
			revisions: [],
			branches: [],
			runData: [],
			dates: { startDate: new Date(), endDate: new Date() },
			runProperties: ['notcompromised'],
			resultProperties: ['unexpected'],
			results: [
				'PASSED',
				'FAILED',
				'KILLED',
				'CORED',
				'SKIPPED',
				'FAKED',
				'INCOMPLETE'
			],
			verdictLookup: VERDICT_TYPE.String,
			verdict: []
		}
	}
};
