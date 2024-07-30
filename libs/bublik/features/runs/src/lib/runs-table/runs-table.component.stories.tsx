/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useState } from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { PaginationState, RowSelectionState } from '@tanstack/react-table';
import { MemoryRouter } from 'react-router-dom';

import {
	RunsTable,
	RunsTableError,
	RunsTableEmpty,
	RunsTableLoading
} from './runs-table.component';

const Story: Meta<typeof RunsTable> = {
	component: RunsTable,
	title: 'runs/Runs Table',
	parameters: { layout: 'padded' },
	decorators: [
		(Story) => <MemoryRouter initialEntries={['/runs']}>{Story()}</MemoryRouter>
	]
};
export default Story;

const Template: StoryFn<typeof RunsTable> = (args) => {
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 10
	});
	const [globalFilter, setGlobalFilter] = useState<string[]>([]);
	const [rowSelection] = useState<RowSelectionState>({});

	return (
		<RunsTable
			{...args}
			onGlobalFilterChange={setGlobalFilter}
			globalFilter={globalFilter}
			rowSelection={rowSelection}
			pagination={pagination}
			onPaginationChange={setPagination}
			pageCount={500}
		/>
	);
};

export const Primary = {
	render: Template,
	args: { data: [] }
};

export const Loading = () => <RunsTableLoading count={25} />;
export const Empty = () => <RunsTableEmpty />;
export const Error = () => <RunsTableError error={{ status: 500 }} />;
