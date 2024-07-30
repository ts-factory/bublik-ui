/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useState } from 'react';
import type { StoryFn, Meta } from '@storybook/react';

import {
	RunTable,
	RunTableEmpty,
	RunTableError,
	RunTableLoading
} from './run-table.component';

import { RunRowStateContextProvider } from '../hooks';
import { ExpandedState, SortingState } from '@tanstack/react-table';

const Story: Meta<typeof RunTable> = {
	component: RunTable,
	title: 'run/Run Table',
	parameters: { layout: 'padded', msw: { handlers: [] } },
	decorators: []
};
export default Story;

const Template: StoryFn<typeof RunTable> = (args) => {
	const [rowState, setRowState] = useState({});
	const [globalFilter, setGlobalFilter] = useState<string[]>([]);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [expanded, setExpanded] = useState<ExpandedState>({ '0': true });

	return (
		<RunRowStateContextProvider value={[rowState, setRowState]}>
			<RunTable
				{...args}
				globalFilter={globalFilter}
				onGlobalFilterChange={setGlobalFilter}
				sorting={sorting}
				onSortingChange={setSorting}
				expanded={expanded}
				onExpandedChange={setExpanded}
			/>
		</RunRowStateContextProvider>
	);
};

export const Primary = {
	render: Template,

	args: {
		data: [],
		renderSubRow: () => null
	}
};

export const Loading = () => <RunTableLoading />;
export const Error = () => <RunTableError error={{ status: 404 }} />;
export const Empty = () => <RunTableEmpty />;
