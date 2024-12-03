/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Meta } from '@storybook/react';
import { withRouter } from 'storybook-addon-remix-react-router';

import { MeasurementsMode } from '@/shared/types';
import { withSidebar } from '@/shared/tailwind-ui';

import { MeasurementsPage } from './measurements-page';

export default {
	component: MeasurementsPage,
	title: 'Bublik UI/Measurements Page',
	decorators: [withRouter, withSidebar()],
	parameters: {
		layout: 'fullscreen',
		reactRouter: {
			routePath: '/runs/:runId/results/:resultId/measurements',
			routeParams: { runId: '15615614', resultId: '15615955' },
			searchParams: { mode: MeasurementsMode.Default }
		},
		msw: {
			handlers: []
		}
	}
} as Meta<typeof MeasurementsPage>;

export const Primary = {
	args: {},

	parameters: {
		reactRouter: { searchParams: { mode: MeasurementsMode.Default } }
	}
};

export const Charts = {
	args: {},

	parameters: {
		reactRouter: { searchParams: { mode: MeasurementsMode.Charts } }
	}
};

export const Tables = {
	args: {},

	parameters: {
		reactRouter: { searchParams: { mode: MeasurementsMode.Tables } }
	}
};

export const Split = {
	args: {},

	parameters: {
		reactRouter: { searchParams: { mode: MeasurementsMode.Split } }
	}
};
