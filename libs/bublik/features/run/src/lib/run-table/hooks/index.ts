/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useCallback } from 'react';
import { Table } from '@tanstack/react-table';

import { MergedRun, RunData } from '@/shared/types';

import {
	getExpandedUnexpectedState,
	getRowValues,
	getUnexpectedGlobalFilter,
	globalFilterToSort,
	toggleSubtree
} from '../utils';
import { RowDecription } from '../context';
import { useRunTableRowState } from '../../hooks';

export interface UseExpandUnexpectedConfig {
	table: Table<RunData | MergedRun>;
	rowsIds: Record<string, RowDecription>;
	rowsValues: Record<string, Record<string, unknown>>;
}

export const useExpandUnexpected = (config: UseExpandUnexpectedConfig) => {
	const { table, rowsIds, rowsValues } = config;
	const packageIds = rowsIds['0'].packageIds;
	const testIds = rowsIds['0'].testIds;
	const rowModel = table.getPreFilteredRowModel();
	const rootRowValues = getRowValues(rowModel.rowsById['0']);
	const globalFilter = getUnexpectedGlobalFilter(rootRowValues);
	const sortingState = globalFilter.map(globalFilterToSort);
	const { expandAllUnexpected, resetRowState } = useRunTableRowState();

	const expandUnexpected = useCallback(() => {
		const [unexpectedRowState, toOpen] = getExpandedUnexpectedState(
			testIds,
			rowsValues
		);

		table.setGlobalFilter(globalFilter);
		table.setExpanded(toggleSubtree(true, packageIds));
		table.setExpanded(toggleSubtree(true, toOpen));
		expandAllUnexpected(unexpectedRowState);
	}, [
		expandAllUnexpected,
		globalFilter,
		packageIds,
		rowsValues,
		table,
		testIds
	]);

	/**
	 * This will not work properly on page reload in dev since open unexpected
	 * router state would be true and this will close all opened test with filters
	 */
	const showUnexpected = useCallback(() => {
		table.setGlobalFilter(globalFilter);
		table.setExpanded(toggleSubtree(true, packageIds));
		table.setExpanded(toggleSubtree(false, testIds));
		table.setSorting(sortingState);
		resetRowState();
	}, [globalFilter, packageIds, resetRowState, sortingState, table, testIds]);

	const reset = useCallback(() => {
		table.setGlobalFilter([]);
		table.setExpanded({ '0': true });
		table.setSorting([]);
		resetRowState();
	}, [resetRowState, table]);

	return { expandUnexpected, showUnexpected, reset } as const;
};
