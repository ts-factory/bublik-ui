/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import type { StoryFn, Meta } from '@storybook/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import {
	MeasurementStatisticsContainer,
	MeasurementStatisticsError,
	MeasurementStatisticsLoading,
	MeasurementStatisticsEmpty
} from './measurement-statistics.container';

const Story: Meta<typeof MeasurementStatisticsContainer> = {
	component: MeasurementStatisticsContainer,
	title: 'measurements/Statistics',
	decorators: [
		(Story) => (
			<MemoryRouter initialEntries={['/runs/1/results/7350/measurements']}>
				<Routes>
					<Route
						path="/runs/:runId/results/:resultId/measurements"
						element={<Story />}
					/>
				</Routes>
			</MemoryRouter>
		)
	],
	parameters: {
		layout: 'padded',
		msw: { handlers: [] },
		reactRouter: {
			routePath: '/runs/1/results/7350/measurements'
		}
	}
};
export default Story;

export const Primary = {
	args: {}
};

export const Error = () => (
	<MeasurementStatisticsError error={{ status: 404 }} />
);

export const Loading = () => (
	<MeasurementStatisticsLoading runId="1" resultId="1" />
);

export const Empty = () => <MeasurementStatisticsEmpty />;
