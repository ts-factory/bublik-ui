/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useCallback, useMemo } from 'react';
import { Row } from '@tanstack/react-table';

import { RunData, RunDataResults } from '@/shared/types';
import { useGetResultsTableQuery } from '@/services/bublik-api';
import { TwTableProps } from '@/shared/tailwind-ui';

import { useRunTableRowState } from '../hooks';
import { ColumnId } from '../run-table/types';
import { ResultTableLoading, ResultTable } from './result-table.component';
import { getRowValues } from '../run-table';

const DEFAULT_REQUEST = {
	[ColumnId.Total]: { results: [], resultProperties: [] }
};

export interface ResultTableContainerProps {
	runId: string;
	row: Row<RunData>;
}

export const ResultTableContainer = ({
	runId,
	row
}: ResultTableContainerProps) => {
	const { id: rowId } = row;
	const rowState = useRunTableRowState().rowState[rowId];
	const { updateRowState } = useRunTableRowState();

	const requests = rowState?.requests
		? Object.keys(rowState.requests).length
			? rowState.requests
			: DEFAULT_REQUEST
		: DEFAULT_REQUEST;

	const { parent_id: parentId, result_id: resultId, name } = row.original;
	const values = useMemo(() => getRowValues(row), [row]);

	const { data, isFetching, isError } = useGetResultsTableQuery({
		parentId: parentId || resultId,
		testName: name,
		requests
	});

	const skeletonCount = useMemo(() => {
		return Math.max(
			Object.keys(requests)
				.map((columnId) => values[columnId])
				.reduce((acc, num) => acc + num, 0)
		);
	}, [requests, values]);

	const getRowProps = useCallback<
		NonNullable<TwTableProps<RunDataResults>['getRowProps']>
	>(
		(_, row) => {
			const className =
				rowState?.referenceDiffRowId === row.id ? 'border-primary' : '';
			return {
				className,
				onClick: (e) => {
					if (rowState?.referenceDiffRowId === row.id) {
						updateRowState({
							rowId,
							referenceDiffRowId: undefined,
							requests: rowState?.requests
						});
					} else {
						updateRowState({
							rowId,
							referenceDiffRowId: row.id,
							requests: rowState?.requests
						});
					}
				}
			};
		},
		[rowId, rowState?.referenceDiffRowId, rowState?.requests, updateRowState]
	);

	if (isError) return <div className="">Something went wrong...</div>;

	if (isFetching) return <ResultTableLoading rowCount={skeletonCount} />;

	if (!data) return <div>No data...</div>;

	return (
		<ResultTable
			data={data}
			runId={runId}
			rowId={rowId}
			getRowProps={getRowProps}
		/>
	);
};
