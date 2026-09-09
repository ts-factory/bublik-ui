/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useCallback, useMemo, useState } from 'react';
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
import { ResultMatrix } from '../result-matrix';

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
	const [view, setView] = useState<'list' | 'matrix'>('list');

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

	const setShowToolbar = useCallback(
		(showToolbar: boolean) => {
			trackEvent(analyticsEventNames.resultTableToolbarToggle, {
				enabled: showToolbar
			});

			return updateRowState({ ...rowState, showToolbar, rowId });
		},
		[updateRowState, rowId, rowState]
	);

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

	if (isFetching) return <ResultTableLoading rowCount={skeletonCount} />;

	if (!data) return <ResultTableEmpty />;

	const path = row.original.path.join('/');

	return (
		<div className="flex flex-col">
			<div className="flex justify-end px-2 pt-1">
				<div className="inline-flex rounded-md border border-border-primary overflow-hidden text-xs">
					{(['list', 'matrix'] as const).map((v) => (
						<button
							key={v}
							type="button"
							aria-pressed={view === v}
							onClick={() => setView(v)}
							className={cn(
								'px-2.5 py-1 border-r border-border-primary last:border-r-0 capitalize',
								view === v
									? 'bg-primary text-white'
									: 'bg-white hover:bg-gray-50'
							)}
						>
							{v === 'list' ? '≣ List' : '▦ Matrix'}
						</button>
					))}
				</div>
			</div>
			{view === 'matrix' ? (
				<ResultMatrix results={data} />
			) : (
				<ResultTable
					showLinkToRun={Array.isArray(runId)}
					data={data}
					rowId={rowId}
					height={height}
					showToolbar={showToolbar}
					setShowToolbar={setShowToolbar}
					targetIterationId={targetIterationId}
					rowState={rowState}
					onRowClick={onRowClick}
					path={path}
				/>
			)}
		</div>
	);
}
