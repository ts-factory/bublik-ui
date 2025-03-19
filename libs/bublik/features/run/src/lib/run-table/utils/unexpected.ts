/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ColumnSort, Row, Table } from '@tanstack/react-table';

import { MergedRun, RunData } from '@/shared/types';

import { GlobalFilterValue, ColumnId } from '../types';
import {
	getUnexpectedResultForColumnId,
	isUnexpectedColumn,
	UnexpectedColumns
} from '../constants';
import { RowState } from '../../hooks';
import { getRowValues } from './get-values';
import { isTest } from './expanding';

export const getUnexpectedGlobalFilter = (
	rowValues: Record<string, number>,
	rootRowId: string
): GlobalFilterValue[] => {
	return Object.entries(rowValues)
		.filter(
			([columnId, value]) => UnexpectedColumns.includes(columnId) && value
		)
		.map(([columnId]) => ({
			columnId: columnId as ColumnId,
			rowId: rootRowId
		}));
};

export const globalFilterToSort = (
	filterValue: GlobalFilterValue
): ColumnSort => ({
	id: filterValue.columnId,
	desc: true
});

export const getExpandedUnexpectedState = (
	table: Table<RunData | MergedRun>
): [Record<string, RowState>, string[]] => {
	const rowModel = table.getPreFilteredRowModel();
	const unexpectedTestRows = rowModel.flatRows
		.filter(containsUnexpected)
		.filter(isTest);

	const unexpectedRowState = unexpectedTestRows.reduce<
		Record<string, RowState>
	>((acc, row) => {
		const rowValues = getRowValues(row);
		const unexpectedColumns = Object.entries(rowValues)
			.filter(([columnId, value]) => isUnexpectedColumn(columnId) && value)
			.map(([columnId]) => columnId);

		if (unexpectedColumns.length === 0) return acc;

		const requests = unexpectedColumns.reduce(
			(reqAcc, columnId) => ({
				...reqAcc,
				[columnId]: getUnexpectedResultForColumnId(columnId)
			}),
			{}
		);

		acc[row.id] = {
			rowId: row.id,
			requests
		};

		return acc;
	}, {});

	const rowIdsToOpen = Object.keys(unexpectedRowState);

	return [unexpectedRowState, rowIdsToOpen];
};

export const hasUnexpected = (data: RunData | MergedRun): boolean => {
	return (
		data.stats.failed_unexpected !== 0 ||
		data.stats.passed_unexpected !== 0 ||
		data.stats.skipped_unexpected !== 0 ||
		data.stats.abnormal !== 0
	);
};

export function containsUnexpected(row: Row<RunData | MergedRun>): boolean {
	return hasUnexpected(row.original);
}
