/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Meta } from '@storybook/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryParamProvider } from 'use-query-params';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';

import { RunDiffPage } from './run-diff-page';

export default {
	component: RunDiffPage,
	title: 'Bublik UI/Run Diff Page',
	decorators: [
		(Story) => (
			<MemoryRouter initialEntries={['/runs/compare?left=1&right=2']}>
				<QueryParamProvider adapter={ReactRouter6Adapter}>
					<Routes>
						<Route path="/runs/compare" element={<Story />} />
					</Routes>
				</QueryParamProvider>
			</MemoryRouter>
		)
	],
	parameters: {
		layout: 'fullscreen',
		reactRouter: { searchParams: { left: '1', right: '2' } },
		msw: { handlers: [] }
	}
} as Meta<typeof RunDiffPage>;

export const Primary = {
	args: {}
};
