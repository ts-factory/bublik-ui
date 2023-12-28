/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC, useMemo } from 'react';
import { Row } from '@tanstack/react-table';

import { RunData } from '@/shared/types';
import { useGetResultsTableQuery } from '@/services/bublik-api';

import { useRunTableRowState } from '../hooks';
import { ColumnId } from '../run-table/types';
import { ResultTableLoading, ResultTable } from './result-table.component';
import { getRowValues } from '../run-table/utils';

const DEFAULT_REQUEST = {
	[ColumnId.Total]: { results: [], resultProperties: [] }
};

export interface ResultTableContainerProps {
	runId: string;
	row: Row<RunData>;
}

export const ResultTableContainer: FC<ResultTableContainerProps> = ({
	runId,
	row
}) => {
	const { id: rowId } = row;
	const rowState = useRunTableRowState().rowState[rowId];
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

	if (isError) return <div>Something went wrong...</div>;

	if (isFetching) return <ResultTableLoading rowCount={skeletonCount} />;

	if (!data) return <div>No data...</div>;

	return <ResultTable data={data} runId={runId} />;
};
