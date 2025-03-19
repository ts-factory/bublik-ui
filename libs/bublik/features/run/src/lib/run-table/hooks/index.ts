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
	toggleSubtree,
	getRootRowId,
	getPackageIdsWithUnexpected,
	getAllTestIds
} from '../utils';
import { useRunTableRowState } from '../../hooks';

export interface UseExpandUnexpectedConfig {
	table: Table<RunData | MergedRun>;
}

export const useExpandUnexpected = (config: UseExpandUnexpectedConfig) => {
	const { table } = config;
	const rootRowId = getRootRowId(table);

	const rowModel = table.getPreFilteredRowModel();

	const rootRowValues = getRowValues(rowModel.rowsById[rootRowId]);
	const globalFilter = getUnexpectedGlobalFilter(rootRowValues, rootRowId);
	const sortingState = globalFilter.map(globalFilterToSort);
	const { expandAllUnexpected, resetRowState } = useRunTableRowState();

	const expandUnexpected = useCallback(() => {
		const packageIdsWithUnexpected = getPackageIdsWithUnexpected(table);
		const [unexpectedRowState, toOpen] = getExpandedUnexpectedState(table);

		table.setGlobalFilter(globalFilter);
		table.setExpanded(
			toggleSubtree(true, [...packageIdsWithUnexpected, ...toOpen])
		);
		expandAllUnexpected(unexpectedRowState);
	}, [expandAllUnexpected, globalFilter, table]);

	/**
	 * This will not work properly on page reload in dev since open unexpected
	 * router state would be true and this will close all opened test with filters
	 */
	const showUnexpected = useCallback(() => {
		const allTestIds = getAllTestIds(table);
		const packageIdsWithUnexpected = getPackageIdsWithUnexpected(table);

		table.setGlobalFilter(globalFilter);
		table.setExpanded(toggleSubtree(true, packageIdsWithUnexpected));
		table.setExpanded(toggleSubtree(false, allTestIds));
		table.setSorting(sortingState);
		resetRowState();
	}, [globalFilter, resetRowState, sortingState, table]);

	const reset = useCallback(() => {
		table.setGlobalFilter([]);
		table.setExpanded({ [rootRowId]: true });
		table.setSorting([]);
		resetRowState();
	}, [resetRowState, rootRowId, table]);

	return { expandUnexpected, showUnexpected, reset } as const;
};
