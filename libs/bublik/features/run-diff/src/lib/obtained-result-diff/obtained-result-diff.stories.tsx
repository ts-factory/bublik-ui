/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import type { StoryFn, Meta } from '@storybook/react';

import { RESULT_TYPE } from '@/shared/types';
import { withBackground } from '@/shared/tailwind-ui';

import { ObtainedResultDiff } from './obtained-result-diff';

const Story: Meta<typeof ObtainedResultDiff> = {
	component: ObtainedResultDiff,
	title: 'diff/Obtained Result Diff',
	parameters: { layout: 'padded' },
	decorators: [withBackground]
};
export default Story;

const Template: StoryFn<typeof ObtainedResultDiff> = (args) => (
	<div className="flex gap-4">
		<div className="flex-1">
			<ObtainedResultDiff {...args} side="left" />
		</div>
		<div className="flex-1">
			<ObtainedResultDiff {...args} side="right" />
		</div>
	</div>
);

export const Primary = {
	render: Template,

	args: {
		leftIsNotExpected: false,
		leftResultType: RESULT_TYPE.Passed,
		leftVerdicts: [
			'verdict-1',
			'verdict-2',
			'verdict-3',
			'verdict-4',
			'verdict-5'
		],
		rightResultType: RESULT_TYPE.Passed,
		rightVerdicts: ['verdict-1', 'verdict-2', 'verdict', 'verdict-4'],
		rightIsNotExpected: false
	}
};
