/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { bublikAPI } from '@/services/bublik-api';

import { RunRowStateContextProvider, useGlobalRequirements } from '../hooks';
import {
	RunTable,
	RunTableError,
	RunTableLoading
} from './run-table.component';
import { useRunPageName, useRunTableQueryState } from './run-table.hooks';

export interface RunTableContainerProps {
	runId: string | string[];
}

export const RunTableContainer = ({ runId }: RunTableContainerProps) => {
	const { globalRequirements } = useGlobalRequirements();

	const { data, isLoading, error, isFetching } = Array.isArray(runId)
		? bublikAPI.useGetMultipleRunsByRunIdsQuery(
				runId.map((id) => ({ runId: id, requirements: globalRequirements }))
		  )
		: bublikAPI.useGetRunTableByRunIdQuery({
				runId,
				requirements: globalRequirements
		  });

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
	} = useRunTableQueryState(data);

	if (error) return <RunTableError error={error} />;

	if (isLoading) return <RunTableLoading />;

	return (
		<RunRowStateContextProvider value={rowStateContext}>
			<RunTable
				runId={runId}
				data={data ?? []}
				openUnexpected={locationState?.openUnexpected}
				openUnexpectedResults={locationState?.openUnexpectedResults}
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
