/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useCallback } from 'react';
import { Row } from '@tanstack/react-table';

import { RunData } from '@/shared/types';
import { useGetRunTableByRunIdQuery } from '@/services/bublik-api';

import { RunRowStateContextProvider } from '../hooks';
import {
	RunTable,
	RunTableEmpty,
	RunTableError,
	RunTableLoading
} from './run-table.component';
import { ResultTableContainer } from '../result-table';
import { useRunPageName, useRunTableQueryState } from './run-table.hooks';

export interface RunTableContainerProps {
	runId: string;
}

export const RunTableContainer = ({ runId }: RunTableContainerProps) => {
	const { data, isLoading, error, isFetching } =
		useGetRunTableByRunIdQuery(runId);

	useRunPageName({ runId });

	const {
		columnVisibility,
		expanded,
		globalFilter,
		locationState,
		rowStateContext,
		setColumnVisibility,
		setExpanded,
		setGlobalFilter,
		setSorting,
		sorting
	} = useRunTableQueryState();

	const renderSubRow = useCallback(
		(row: Row<RunData>) => {
			return (
				<div style={{ paddingLeft: `${row.depth * 0.8}rem` }}>
					<ResultTableContainer runId={runId} row={row} />
				</div>
			);
		},
		[runId]
	);

	if (error) return <RunTableError error={error} />;

	if (isLoading) return <RunTableLoading />;

	if (!data) return <RunTableEmpty />;

	return (
		<RunRowStateContextProvider value={rowStateContext}>
			<RunTable
				data={data}
				openUnexpected={locationState?.openUnexpected}
				openUnexpectedResults={locationState?.openUnexpectedResults}
				renderSubRow={renderSubRow}
				expanded={expanded}
				globalFilter={globalFilter}
				onExpandedChange={setExpanded}
				onGlobalFilterChange={setGlobalFilter}
				sorting={sorting}
				onSortingChange={setSorting}
				columnVisibility={columnVisibility}
				onColumnVisibilityChange={setColumnVisibility}
				isFetching={isFetching}
			/>
		</RunRowStateContextProvider>
	);
};
