/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { StoryFn, Meta } from '@storybook/react';
import { withRouter } from 'storybook-addon-remix-react-router';

import { Layout } from './layout';

export default {
	component: Layout,
	title: 'Bublik UI/Layout',
	decorators: [withRouter],
	parameters: {
		layout: 'fullscreen',
		reactRouter: {
			routePath: '/dashboard'
		}
	}
} as Meta<typeof Layout>;

const Template: StoryFn<typeof Layout> = (args) => (
	<Layout {...args}>
		<div className="grid h-screen place-items-center">
			<h1 className="p-4 bg-white rounded-md">Main Content</h1>
		</div>
	</Layout>
);

export const Primary = {
	render: Template,
	args: {}
};

export const WithSubitems = {
	render: Template,
	args: {},

	parameters: {
		reactRouter: {
			routePath: '/history',
			searchParams: { mode: 'aggregation' }
		}
	}
};
