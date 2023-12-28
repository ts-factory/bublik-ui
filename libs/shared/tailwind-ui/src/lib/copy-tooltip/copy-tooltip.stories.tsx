/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { CopyTooltip, CopyTooltipProps } from './copy-tooltip';

export default {
	component: CopyTooltip,
	title: 'components/Copy Tooltip'
} as Meta;

const Template: StoryFn<CopyTooltipProps> = (args) => (
	<CopyTooltip {...args}>
		<span>TCPDIRECTREV: 88d4ba5ceb831c9c2d404844520b1c70736ed120 master</span>
	</CopyTooltip>
);

export const Primary = {
	render: Template,
	args: { copyString: 'Super string' }
};
