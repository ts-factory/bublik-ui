/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryParamProvider } from 'use-query-params';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';

import { RunPage } from './run-page';
import {
	runStatsHandler,
	runDetailsHandler,
	runStatsNoUnexpectedHandler
} from '../log-page/log-page.mock';

export default {
	component: RunPage,
	title: 'Bublik UI/Run Page',
	decorators: [
		(Story) => (
			<MemoryRouter initialEntries={['/runs/1']}>
				<QueryParamProvider adapter={ReactRouter6Adapter}>
					<Routes>
						<Route path="/runs/:runId" element={<Story />} />
					</Routes>
				</QueryParamProvider>
			</MemoryRouter>
		)
	],
	parameters: {
		layout: 'fullscreen',
		reactRouter: {
			routePath: '/runs/:runId',
			routeParams: { runId: '15615614' }
		}
	}
} satisfies Meta<typeof RunPage>;

type Story = StoryObj<typeof RunPage>;
export const Primary = {
	args: {},
	parameters: {
		msw: { handlers: [runStatsHandler, runDetailsHandler] }
	}
} satisfies Story;

export const NoUnexpected = {
	args: {},
	parameters: {
		msw: { handlers: [runStatsNoUnexpectedHandler, runDetailsHandler] }
	}
} satisfies Story;
