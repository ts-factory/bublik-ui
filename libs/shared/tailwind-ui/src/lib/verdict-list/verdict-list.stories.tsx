/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Meta } from '@storybook/react';

import { RESULT_TYPE } from '@/shared/types';

import { VerdictList } from './verdict-list';

import { withBackground } from '../storybook-bg';

export default {
	component: VerdictList,
	title: 'components/Verdict List',
	decorators: [withBackground]
} as Meta;

export const Obtained = {
	args: {
		variant: 'obtained',
		result: RESULT_TYPE.Passed,
		verdicts: [
			'verdict-1',
			'verdict-2',
			'verdict-3',
			'verdict-4',
			'verdict-5',
			'verdict-6'
		],
		isResultSelected: false,
		selectedVerdicts: ['verdict-5', 'verdict-3']
	}
};

export const Expected = {
	args: {
		variant: 'expected',
		result: RESULT_TYPE.Passed,
		verdicts: [
			'verdict-1',
			'verdict-2',
			'verdict-3',
			'verdict-4',
			'verdict-5',
			'verdict-6'
		],
		isResultSelected: false,
		selectedVerdicts: ['verdict-5', 'verdict-3']
	}
};
