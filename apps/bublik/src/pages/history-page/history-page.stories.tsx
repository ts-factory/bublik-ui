/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Meta, StoryObj } from '@storybook/react';
import { withRouter } from 'storybook-addon-react-router-v6';

import { withSidebar } from '@/shared/tailwind-ui';

import {
	historyAggregationHandler,
	historyLinearHandler,
	historyMeasurementsHandler
} from './history-page.mock';
import { HistoryPageV2 } from './history-page';

export default {
	component: HistoryPageV2,
	title: 'Bublik UI/History Page',
	parameters: {
		layout: 'fullscreen',
		reactRouter: {
			routePath: '/history',
			searchParams: { testName: 'hello' }
		},
		msw: {
			handlers: [
				historyAggregationHandler,
				historyLinearHandler,
				historyMeasurementsHandler
			]
		}
	},
	decorators: [withRouter, withSidebar()]
} as Meta<typeof HistoryPageV2>;

type Story = StoryObj<typeof HistoryPageV2>;
export const Linear: Story = {
	parameters: {}
};

export const Aggregation = {
	parameters: {
		reactRouter: { searchParams: { mode: 'aggregation' } }
	}
};

export const Measurements = {
	parameters: {
		reactRouter: { searchParams: { mode: 'measurements' } }
	}
};
