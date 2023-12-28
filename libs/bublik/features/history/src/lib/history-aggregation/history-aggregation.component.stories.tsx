/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useState } from 'react';
import { PaginationState } from '@tanstack/react-table';
import { Meta, StoryFn } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';

import {
	HistoryAggregation,
	HistoryLoadingAggregation
} from './history-aggregation.component';
import { historyAggregationMock } from './history-aggregation.component.mock';
import { HistoryAggregationGlobalFilter } from './history-aggregation.types';
import { HistoryEmpty } from '../history-empty';
import { HistoryError } from '../history-error';

const Story: Meta<typeof HistoryAggregation> = {
	component: HistoryAggregation,
	title: 'history/Aggregation Table',
	parameters: { layout: 'padded' },
	decorators: [(Story) => <MemoryRouter>{Story()}</MemoryRouter>]
};
export default Story;

const Template: StoryFn<typeof HistoryAggregation> = (args) => {
	const [globalFilter, setGlobalFilter] =
		useState<HistoryAggregationGlobalFilter>({
			resultType: null,
			parameters: [],
			verdicts: [],
			isNotExpected: null,
			substringFilter: ''
		});

	const [pagination, setPagination] = useState<PaginationState>({
		pageSize: 25,
		pageIndex: 0
	});

	return (
		<HistoryAggregation
			{...args}
			pageCount={300}
			pagination={pagination}
			onPaginationChange={setPagination}
			globalFilter={globalFilter}
			onGlobalFilterChange={setGlobalFilter}
		/>
	);
};

export const Primary = {
	render: Template,

	args: {
		data: historyAggregationMock
	}
};

export const Loading = () => <HistoryLoadingAggregation rowCount={25} />;
export const NoTestName = () => <HistoryEmpty type="no-test-name" />;
export const NoResults = () => <HistoryEmpty type="no-results" />;
export const Error = () => <HistoryError error={{ status: 404 }} />;
