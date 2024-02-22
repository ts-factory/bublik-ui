/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ColumnSort } from '@tanstack/react-table';

import { RunData } from '@/shared/types';

import { GlobalFilterValue, ColumnId } from '../types';
import {
	getUnexpectedResultForColumnId,
	isUnexpectedColumn,
	UnexpectedColumns
} from '../constants';
import { RowState } from '../../hooks';

export const getUnexpectedGlobalFilter = (
	rowValues: Record<string, number>
): GlobalFilterValue[] => {
	return Object.entries(rowValues)
		.filter(
			([columnId, value]) => UnexpectedColumns.includes(columnId) && value
		)
		.map(([columnId]) => ({ columnId: columnId as ColumnId, rowId: '0' }));
};

export const globalFilterToSort = (
	filterValue: GlobalFilterValue
): ColumnSort => ({
	id: filterValue.columnId,
	desc: true
});

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

export const getExpandedUnexpectedState = (
	testIds: string[],
	rowsValues: Record<string, Record<string, unknown>>
): [Record<string, RowState>, string[]] => {
	const unexpectedRowState: Record<string, RowState> = {};

	testIds.forEach((id) => {
		const rowValues = rowsValues[id];
		const rowState: WithRequired<RowState, 'requests'> = {
			rowId: id,
			requests: {}
		};

		Object.entries(rowValues).forEach(([column, value]) => {
			if (!isUnexpectedColumn(column) || !value) return;

			rowState.requests[column] = getUnexpectedResultForColumnId(column);
		});

		unexpectedRowState[id] = rowState;
	});

	Object.values(unexpectedRowState).forEach((row) => {
		if (Object.keys(row.requests || {}).length !== 0) return;

		delete unexpectedRowState[row.rowId];
	});

	const toOpen = Object.keys(unexpectedRowState);

	return [unexpectedRowState, toOpen];
};

export const hasUnexpected = (data: RunData): boolean => {
	return (
		data.stats.failed_unexpected !== 0 ||
		data.stats.passed_unexpected !== 0 ||
		data.stats.skipped_unexpected !== 0
	);
};
