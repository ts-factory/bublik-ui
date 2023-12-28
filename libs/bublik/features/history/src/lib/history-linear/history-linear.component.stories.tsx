/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useState } from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { PaginationState } from '@tanstack/react-table';
import { MemoryRouter } from 'react-router-dom';

import {
	HistoryLinearLoading,
	HistoryLinearTable
} from './history-linear.component';
import { HistoryEmpty } from '../history-empty';
import { historyLinearMock } from './history-linear.component.mock';
import { HistoryLinearGlobalFilter } from './history-linear.types';
import { HistoryError } from '../history-error';

const Story: Meta<typeof HistoryLinearTable> = {
	component: HistoryLinearTable,
	title: 'history/Linear Table',
	parameters: { layout: 'padded' },
	decorators: [(Story) => <MemoryRouter>{Story()}</MemoryRouter>]
};
export default Story;

const Template: StoryFn<typeof HistoryLinearTable> = (args) => {
	const [pagination, setPagination] = useState<PaginationState>({
		pageSize: 25,
		pageIndex: 0
	});
	const [globalFilter, setGlobalFilter] = useState<HistoryLinearGlobalFilter>({
		resultType: null,
		isNotExpected: null,
		parameters: [],
		verdicts: [],
		tags: [],
		substringFilter: ''
	});

	return (
		<HistoryLinearTable
			{...args}
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
		data: historyLinearMock,
		pageCount: 300,
		pagination: { pageSize: 25, pageIndex: 0 }
	}
};

export const Loading = () => <HistoryLinearLoading />;
export const NoTestName = () => <HistoryEmpty type="no-test-name" />;
export const NoResults = () => <HistoryEmpty type="no-results" />;
export const Error = () => <HistoryError error={{ status: 404 }} />;
