/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { StoryFn, Meta } from '@storybook/react';
import { withBackground } from '../storybook-bg';

import { SessionDiff } from './session-diff';
import { DiffMethod } from './utils';

const Story: Meta<typeof SessionDiff> = {
	component: SessionDiff,
	title: 'components/Session Diff',
	parameters: { layout: 'padded' },
	decorators: [withBackground]
};
export default Story;

const Template: StoryFn<typeof SessionDiff> = (args) => (
	<div className="overflow-scroll">
		<SessionDiff {...args} />
	</div>
);

export const Primary = {
	render: Template,

	args: {
		compareMethod: DiffMethod.CHARS,
		viewType: 'line',
		oldValue: '',
		newValue: ''
	}
};
