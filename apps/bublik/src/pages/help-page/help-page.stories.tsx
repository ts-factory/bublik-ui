/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Meta } from '@storybook/react';

import { HelpPage } from './help-page';
import { MemoryRouter } from 'react-router-dom';

export default {
	component: HelpPage,
	title: 'Bublik UI/Help Page',
	parameters: {
		layout: 'fullscreen',
		reactRouter: { routePath: 'help/faq' },
		msw: { handlers: [] }
	},
	decorators: [
		(Story) => (
			<MemoryRouter initialEntries={['/help/faq']}>
				<Story />
			</MemoryRouter>
		)
	]
} as Meta<typeof HelpPage>;

export const Primary = {
	args: {},
	parameters: {}
};
