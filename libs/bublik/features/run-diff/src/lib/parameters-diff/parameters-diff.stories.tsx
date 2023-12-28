/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import type { StoryFn, Meta } from '@storybook/react';

import { withBackground } from '@/shared/tailwind-ui';

import { ParametersDiff } from './parameters-diff';

const Story: Meta<typeof ParametersDiff> = {
	component: ParametersDiff,
	title: 'diff/Parameters Diff',
	parameters: { layout: 'padded' },
	decorators: [withBackground]
};
export default Story;

const Template: StoryFn<typeof ParametersDiff> = (args) => (
	<div className="flex gap-4">
		<div className="flex-1">
			<ParametersDiff {...args} side="left" />
		</div>
		<div className="flex-1">
			<ParametersDiff {...args} side="right" />
		</div>
	</div>
);

export const Primary = {
	render: Template,

	args: {
		left: ['one', 'two', 'three'],
		right: ['one', 'four', 'five']
	}
};
