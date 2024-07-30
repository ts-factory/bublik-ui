/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Meta } from '@storybook/react';
import { withRouter } from 'storybook-addon-react-router-v6';

import { DashboardPageV2 } from './dashboard-page-v2';

export default {
	component: DashboardPageV2,
	title: 'Bublik UI/Dashboard Page',
	decorators: [withRouter],
	reactRouter: { routePath: '/dashboard' },
	parameters: { layout: 'fullscreen' }
} as Meta<typeof DashboardPageV2>;

export const Primary = {
	args: {},
	parameters: {
		msw: { handlers: [] }
	}
};
