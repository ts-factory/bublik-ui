/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useMemo } from 'react';
import { Row } from '@tanstack/react-table';

import { MergedRun, RunData } from '@/shared/types';
import { useGetResultsTableQuery } from '@/services/bublik-api';

import { useRunTableRowState } from '../hooks';
import { ColumnId } from '../run-table/types';
import { classifyParams, toIterations } from '../result-matrix/matrix-analysis';

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

/**
 * The iterations of an expanded run-table test row, plus what the views
 * derive from them. Every caller with the same row shares one RTK Query
 * cache entry, so the row's List / Matrix switch and the expanded content
 * can both use it without an extra request.
 */
export function useRunResults(row: Row<RunData | MergedRun>) {
	const rowState = useRunTableRowState().rowState[row.id];

	const requests = rowState?.requests
		? Object.keys(rowState.requests).length
			? rowState.requests
			: DEFAULT_REQUEST
		: DEFAULT_REQUEST;

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
	// The matrix needs two parameters to cross.
	const canShowMatrix = classification.varying.length >= 2;

	return {
		requests,
		data,
		isFetching,
		isError,
		error,
		iterations,
		classification,
		canShowMatrix
	};
}
