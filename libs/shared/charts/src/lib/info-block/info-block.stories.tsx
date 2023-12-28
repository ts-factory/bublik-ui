/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { StoryFn, Meta } from '@storybook/react';
import { InfoBlock } from './info-block';

export default {
	component: InfoBlock,
	title: 'charts/Info Block',
	parameters: { layout: 'padded' }
} as Meta<typeof InfoBlock>;

const Template: StoryFn<typeof InfoBlock> = (args) => (
	<div className="p-4 bg-white rounded-md">
		<InfoBlock {...args} />
	</div>
);

export const Primary = {
	render: Template,

	args: {
		name: 'app_rtt',
		obtainedResult: 'FAILED',
		isError: true,
		parameters: [
			'chunk_size=150000',
			'delay=50',
			'env=VAR.env.peer2peer',
			'limit=50000',
			'rate=10',
			'set_dsack=FALSE',
			'set_sack=TRUE',
			'set_ts=FALSE',
			'stimulus=slow_start',
			'stimulus_param=0'
		],
		separator: '='
	}
};
