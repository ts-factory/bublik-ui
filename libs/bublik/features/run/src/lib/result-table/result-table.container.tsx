/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useCallback, useMemo } from 'react';
import { Row } from '@tanstack/react-table';

import { MergedRun, RunData, RunDataResults } from '@/shared/types';
import { useGetResultsTableQuery } from '@/services/bublik-api';
import { TwTableProps } from '@/shared/tailwind-ui';

import { useRunTableRowState } from '../hooks';
import { ColumnId } from '../run-table/types';
import { ResultTableLoading, ResultTable } from './result-table.component';
import { getRowValues } from '../run-table';

function getParentId(row: Row<RunData | MergedRun>) {
	return 'parent_ids' in row.original
		? row.original.parent_ids.length
			? row.original.parent_ids
			: row.original.result_ids
		: row.original.parent_id ?? row.original.result_id;
}

const DEFAULT_REQUEST = {
	[ColumnId.Total]: { results: [], resultProperties: [] }
};

export interface ResultTableContainerProps {
	runId: string | string[];
	row: Row<RunData | MergedRun>;
	height: number;
	targetIterationId?: number;
}

export function ResultTableContainer(props: ResultTableContainerProps) {
	const { runId, row, height, targetIterationId } = props;
	const { id: rowId } = row;
	const rowState = useRunTableRowState().rowState[rowId];
	const { updateRowState } = useRunTableRowState();

	const requests = rowState?.requests
		? Object.keys(rowState.requests).length
			? rowState.requests
			: DEFAULT_REQUEST
		: DEFAULT_REQUEST;

	const values = useMemo(() => getRowValues(row), [row]);

	const { data, isFetching, isError } = useGetResultsTableQuery({
		parentId: getParentId(row),
		testName: row.original.name,
		requests
	});

	const skeletonCount = useMemo(() => {
		return Math.max(
			Object.keys(requests)
				.map((columnId) => values[columnId])
				.reduce((acc, num) => acc + num, 0)
		);
	}, [requests, values]);

	const showToolbar = useMemo(() => {
		return rowState?.showToolbar ?? false;
	}, [rowState?.showToolbar]);

	const setMode = useCallback(
		(mode: 'default' | 'diff') => {
			return updateRowState({
				...rowState,
				mode,
				rowId,
				referenceDiffRowId:
					mode === 'diff' ? rowState?.referenceDiffRowId : undefined,
				showToolbar: showToolbar
			});
		},
		[rowState, updateRowState, rowId, showToolbar]
	);

	const setShowToolbar = useCallback(
		(showToolbar: boolean) => {
			return updateRowState({ ...rowState, showToolbar, rowId });
		},
		[updateRowState, rowId, rowState]
	);

	const getRowProps = useCallback<
		NonNullable<TwTableProps<RunDataResults>['getRowProps']>
	>(
		(_, row) => {
			const className =
				rowState?.referenceDiffRowId === row.id ? 'border-primary' : '';

			return {
				className,
				onClick: () => {
					if (rowState?.mode === 'default' || !rowState?.mode) return;

					if (rowState?.referenceDiffRowId === row.id) {
						updateRowState({
							...rowState,
							rowId,
							referenceDiffRowId: undefined,
							requests: rowState?.requests,
							mode: 'diff'
						});
					} else {
						updateRowState({
							...rowState,
							rowId,
							referenceDiffRowId: row.id,
							requests: rowState?.requests,
							mode: 'diff'
						});
					}
				}
			};
		},
		[rowId, rowState, updateRowState]
	);

	if (isError) return <div className="">Something went wrong...</div>;

	if (isFetching) return <ResultTableLoading rowCount={skeletonCount} />;

	if (!data) return <div>No data...</div>;

	return (
		<ResultTable
			showLinkToRun={Array.isArray(runId)}
			data={data}
			rowId={rowId}
			getRowProps={getRowProps}
			height={height}
			mode={rowState?.mode}
			setMode={setMode}
			showToolbar={showToolbar}
			setShowToolbar={setShowToolbar}
			targetIterationId={targetIterationId}
		/>
	);
}
