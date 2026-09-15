/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useCallback, useMemo } from 'react';
import { Row } from '@tanstack/react-table';

import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import { MergedRun, RunData, RunDataResults } from '@/shared/types';
import { useGetResultsTableQuery } from '@/services/bublik-api';
import { cn } from '@/shared/tailwind-ui';

import { useRunTableRowState } from '../hooks';
import { ColumnId } from '../run-table/types';
import {
	ResultTable,
	ResultTableEmpty,
	ResultTableError,
	ResultTableLoading
} from './result-table.component';
import { getRowValues } from '../run-table';
import { RunHistoryLink } from './run-history-link';
import {
	ResultMatrixContainer,
	ResultViewMode,
	classifyParams,
	toIterations,
	useResultView
} from '../result-matrix';
import { ResultViewBar, ResultViewToggle } from './result-view-toggle';

function getResultSelectors(row: Row<RunData | MergedRun>) {
	return 'parent_ids' in row.original
		? row.original.result_selectors
		: [
				{
					parentId: row.original.parent_id ?? row.original.result_id,
					startExecSeqno: row.original.exec_seqno
				}
		  ];
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
	const { view: requestedView, patch: patchView } = useResultView(rowId);

	const requests = rowState?.requests
		? Object.keys(rowState.requests).length
			? rowState.requests
			: DEFAULT_REQUEST
		: DEFAULT_REQUEST;

	const values = useMemo(() => getRowValues(row), [row]);

	const { data, isFetching, isError, error } = useGetResultsTableQuery({
		selectors: getResultSelectors(row),
		testName: row.original.test_name,
		requests
	});

	const iterations = useMemo(() => toIterations(data ?? []), [data]);
	const classification = useMemo(
		() => classifyParams(iterations),
		[iterations]
	);
	const canShowMatrix = classification.varying.length >= 2;
	const view: ResultViewMode =
		requestedView === 'matrix' && canShowMatrix ? 'matrix' : 'list';

	const handleViewChange = useCallback(
		(next: ResultViewMode) => {
			trackEvent(analyticsEventNames.resultViewToggle, { view: next });
			// 'list' is the default, so it is stored as "no value".
			patchView({ view: next === 'list' ? undefined : next });
		},
		[patchView]
	);

	const skeletonCount = useMemo(() => {
		return Math.max(
			Object.keys(requests)
				.map((columnId) => values[columnId])
				.reduce((acc, num) => acc + num, 0)
		);
	}, [requests, values]);

	const onRowClick = useCallback(
		(row: Row<RunDataResults>) => {
			const referenceDiffRowId =
				rowState?.referenceDiffRowId === row.id ? undefined : row.id;

			trackEvent(analyticsEventNames.resultTableReferenceToggle, {
				action: rowState?.referenceDiffRowId === row.id ? 'unselect' : 'select',
				hasReference: Boolean(referenceDiffRowId)
			});

			updateRowState({
				...rowState,
				rowId,
				referenceDiffRowId
			});
		},
		[rowId, rowState, updateRowState]
	);

	if (isError) return <ResultTableError error={error} />;

	// Skeleton only before the first rows arrive. A refetch, after a classify or
	// a filter change, dims the rows already shown instead of replacing them.
	if (!data && isFetching) {
		return <ResultTableLoading rowCount={skeletonCount} />;
	}

	if (!data) return <ResultTableEmpty />;

	const path = row.original.path.join('/');
	const viewToggle = (
		<ResultViewToggle
			value={view}
			onChange={handleViewChange}
			matrixDisabled={!canShowMatrix}
		/>
	);

	return (
		// `w-0 min-w-full` keeps a wide matrix from stretching the run table:
		// the matrix scrolls inside the expanded row instead.
		<div className={cn('flex flex-col', view === 'matrix' && 'w-0 min-w-full')}>
			{view === 'matrix' ? (
				<ResultMatrixContainer
					rowId={rowId}
					testName={row.original.test_name}
					data={data}
					iterations={iterations}
					classification={classification}
					viewToggle={viewToggle}
				/>
			) : (
				<>
					<ResultViewBar left={viewToggle} />
					<ResultTable
						showLinkToRun={Array.isArray(runId)}
						data={data}
						rowId={rowId}
						height={height}
						// One run's results have one history to open; merged runs have none.
						toolbarTrailing={
							Array.isArray(runId) ? null : (
								<RunHistoryLink
									runIds={[Number(runId)]}
									path={row.original.path}
								/>
							)
						}
						toolbarClassName="border-x border-border-primary"
						targetIterationId={targetIterationId}
						rowState={rowState}
						onRowClick={onRowClick}
						path={path}
						isFetching={isFetching}
					/>
				</>
			)}
		</div>
	);
}
