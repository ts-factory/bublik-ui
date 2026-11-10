/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useCallback, useMemo } from 'react';
import { Row } from '@tanstack/react-table';

import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import { MergedRun, RunData, RunDataResults } from '@/shared/types';
import { cn } from '@/shared/tailwind-ui';

import { useRunTableRowState } from '../hooks';
import {
	ResultTable,
	ResultTableEmpty,
	ResultTableError,
	ResultTableLoading
} from './result-table.component';
import { getRowValues } from '../run-table';
import { RunHistoryLink } from './run-history-link';
import { ResultViewToggle } from './result-view-toggle';
import {
	ResultMatrixContainer,
	ResultViewMode,
	useResultView
} from '../result-matrix';
import { useRunResults } from './use-run-results';

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

	const values = useMemo(() => getRowValues(row), [row]);

	const {
		requests,
		data,
		isFetching,
		isError,
		error,
		iterations,
		classification,
		canShowMatrix
	} = useRunResults(row);
	const view: ResultViewMode =
		requestedView === 'matrix' && canShowMatrix ? 'matrix' : 'list';

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

	const handleViewChange = useCallback(
		(next: ResultViewMode) => {
			trackEvent(analyticsEventNames.resultViewToggle, { view: next });
			// 'list' is the default, so it is stored as "no value".
			patchView({ view: next === 'list' ? undefined : next });
		},
		[patchView]
	);

	if (isError) return <ResultTableError error={error} />;

	// Skeleton only before the first rows arrive. A refetch, after a classify or
	// a filter change, dims the rows already shown instead of replacing them.
	if (!data && isFetching) {
		return <ResultTableLoading rowCount={skeletonCount} />;
	}

	if (!data) return <ResultTableEmpty />;

	const path = row.original.path.join('/');
	// The same filter bar in both views: the switch after Select All (which
	// only the list has), the History link at the end. One run's results have one history to open;
	// merged runs have none.
	const toolbarActions = (
		<ResultViewToggle
			value={view}
			onChange={handleViewChange}
			matrixDisabled={!canShowMatrix}
		/>
	);
	const toolbarTrailing = Array.isArray(runId) ? null : (
		<RunHistoryLink runIds={[Number(runId)]} path={row.original.path} />
	);
	const toolbarClassName = 'border-x border-border-primary';

	return (
		// `w-0 min-w-full` keeps a wide matrix from stretching the run table:
		// the matrix scrolls inside the expanded row instead.
		<div className={cn('flex flex-col', view === 'matrix' && 'w-0 min-w-full')}>
			{view === 'matrix' ? (
				<ResultMatrixContainer
					rowId={rowId}
					data={data}
					iterations={iterations}
					classification={classification}
					height={height}
					showLinkToRun={Array.isArray(runId)}
					path={path}
					toolbarActions={toolbarActions}
					toolbarTrailing={toolbarTrailing}
					toolbarClassName={toolbarClassName}
				/>
			) : (
				<ResultTable
					showLinkToRun={Array.isArray(runId)}
					data={data}
					rowId={rowId}
					height={height}
					indent={row.depth * 0.8}
					toolbarActions={toolbarActions}
					toolbarTrailing={toolbarTrailing}
					toolbarClassName={toolbarClassName}
					targetIterationId={targetIterationId}
					rowState={rowState}
					onRowClick={onRowClick}
					path={path}
					isFetching={isFetching}
				/>
			)}
		</div>
	);
}
