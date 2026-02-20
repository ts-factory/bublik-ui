/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { bublikAPI, useGetRunDetailsQuery } from '@/services/bublik-api';
import { skipToken } from '@reduxjs/toolkit/query';

import { RunRowStateContextProvider, useGlobalRequirements } from '../hooks';
import {
	RunTable,
	RunTableError,
	RunTableLoading
} from './run-table.component';
import { useRunPageName, useRunTableQueryState } from './run-table.hooks';

function getSingleRunId(runId: string | string[]) {
	if (typeof runId === 'string') return runId;
	if (new Set(runId).size === 1) return runId[0];

	return skipToken;
}

export interface RunTableContainerProps {
	runId: string | string[];
}

export const RunTableContainer = ({ runId }: RunTableContainerProps) => {
	useRunPageName({ runId });

	const { globalRequirements } = useGlobalRequirements();

	const { data, isLoading, error, isFetching } = Array.isArray(runId)
		? bublikAPI.useGetMultipleRunsByRunIdsQuery(
				runId.map((id) => ({ runId: id, requirements: globalRequirements }))
		  )
		: bublikAPI.useGetRunTableByRunIdQuery({
				runId,
				requirements: globalRequirements
		  });

	const detailsQuery = useGetRunDetailsQuery(getSingleRunId(runId));

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
		sorting,
		targetIterationId
	} = useRunTableQueryState(data);

	if (error || detailsQuery.error) {
		return <RunTableError error={error || detailsQuery.error} />;
	}

	if (isLoading || detailsQuery.isLoading) {
		return <RunTableLoading />;
	}

	return (
		<RunRowStateContextProvider value={rowStateContext}>
			<RunTable
				runId={runId}
				projectId={detailsQuery.data?.project_id}
				data={data ?? []}
				openUnexpected={locationState?.openUnexpected}
				openUnexpectedResults={locationState?.openUnexpectedResults}
				openUnexpectedIntentId={locationState?.openUnexpectedIntentId}
				expanded={expanded}
				globalFilter={globalFilter}
				onExpandedChange={setExpanded}
				onGlobalFilterChange={setGlobalFilter}
				sorting={sorting}
				onSortingChange={setSorting}
				columnVisibility={columnVisibility}
				onColumnVisibilityChange={setColumnVisibility}
				isFetching={isFetching}
				targetIterationId={targetIterationId}
			/>
		</RunRowStateContextProvider>
	);
};
