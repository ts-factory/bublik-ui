/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import type { Meta, StoryFn, StoryObj } from '@storybook/react';
import { withRouter } from 'storybook-addon-remix-react-router';

import { ContextLinks } from './context-links.component';
import { withBackground } from '../storybook-bg';

const meta: Meta<typeof ContextLinks> = {
	component: ContextLinks,
	title: 'components/Context Links',
	decorators: [withBackground, withRouter]
};
export default meta;
type Story = StoryObj<typeof ContextLinks>;

const Template: StoryFn<typeof ContextLinks> = (args) => (
	<ContextLinks {...args}>
		<div>Hover me</div>
	</ContextLinks>
);

export const Primary: Story = {
	render: Template,
	args: {
		sections: [
			{
				label: 'Section 1',
				items: [
					{
						label: 'Link 1',
						to: '/test'
					},
					{
						label: 'Link 2',
						to: '/test'
					},
					{
						label: 'Link 3',
						to: '/test'
					}
				]
			},
			{
				label: 'Section 2',
				items: [
					{
						label: 'Link 1',
						to: '/test'
					},
					{
						label: 'Link 2',
						to: '/test'
					}
				]
			}
		]
	}
};
