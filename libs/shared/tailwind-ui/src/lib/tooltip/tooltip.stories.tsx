/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { StoryFn, Meta } from '@storybook/react';

import { withBackground } from '../storybook-bg';
import { ButtonTw } from '../button';
import { Tooltip, TooltipProps } from './tooltip';

export default {
	component: Tooltip,
	title: 'components/Tooltip',
	decorators: [withBackground]
} as Meta;

const Template: StoryFn<TooltipProps> = (args) => (
	<Tooltip {...args}>
		<ButtonTw size="xss" variant="secondary">
			Button
		</ButtonTw>
	</Tooltip>
);

export const Primary = {
	render: Template,

	args: {
		content: 'This is a tooltip',
		open: true,
		side: 'top',
		disabled: false
	}
};
