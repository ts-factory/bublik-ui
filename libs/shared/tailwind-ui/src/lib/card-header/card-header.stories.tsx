/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { StoryFn, Meta } from '@storybook/react';
import { ButtonTw } from '../button';
import { CardHeader } from './card-header';

export default {
	component: CardHeader,
	title: 'components/Card Header',
	parameters: { layout: 'padded' }
} as Meta<typeof CardHeader>;

const Template: StoryFn<typeof CardHeader> = (args) => (
	<div className="bg-white rounded-t-md">
		<CardHeader {...args}>
			<div className="flex items-center gap-2">
				<ButtonTw size="xss" variant="secondary">
					Button One
				</ButtonTw>
				<ButtonTw size="xss" variant="secondary">
					Button Two
				</ButtonTw>
			</div>
		</CardHeader>
	</div>
);

export const Primary = {
	render: Template,

	args: {
		label: 'Heading'
	}
};
