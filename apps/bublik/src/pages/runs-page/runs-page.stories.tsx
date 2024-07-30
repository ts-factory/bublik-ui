/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Meta } from '@storybook/react';
import { withRouter } from 'storybook-addon-react-router-v6';

import { RunsPage } from './runs-page';

export default {
	component: RunsPage,
	title: 'Bublik UI/Runs Page',
	decorators: [withRouter],
	parameters: {
		layout: 'fullscreen',
		reactRouter: { routePath: '/runs' },
		msw: { handlers: [] }
	}
} as Meta<typeof RunsPage>;

export const Primary = {
	args: {}
};
