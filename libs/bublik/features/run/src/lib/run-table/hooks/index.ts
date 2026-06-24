/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useCallback } from 'react';
import { Row, Table } from '@tanstack/react-table';

import { MergedRun, RunData } from '@/shared/types';

import {
	getExpandedUnexpectedState,
	getRowValues,
	getUnexpectedGlobalFilter,
	toggleSubtree,
	getRootRowId,
	getPackageIdsWithUnexpected,
	getAllTestIds
} from '../utils';
import { getResultFilterForColumnId } from '../columns/badge-columns';
import { useRunTableRowState } from '../../hooks';

export interface UseExpandUnexpectedConfig {
	table: Table<RunData | MergedRun>;
}

function getStartTirId(data: RunData | MergedRun): number {
	return 'result_ids' in data ? Math.min(...data.result_ids) : data.result_id;
}

export const useExpandUnexpected = (config: UseExpandUnexpectedConfig) => {
	const { table } = config;
	const rootRowId = getRootRowId(table);

	const rowModel = table.getPreFilteredRowModel();

	const rootRowValues = getRowValues(rowModel.rowsById[rootRowId]);
	const globalFilter = getUnexpectedGlobalFilter(rootRowValues, rootRowId);
	const { expandAllUnexpected, resetRowState, updateRowState } =
		useRunTableRowState();

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
		resetRowState();
	}, [globalFilter, resetRowState, table]);

	const reset = useCallback(() => {
		table.setGlobalFilter([]);
		table.setExpanded({ [rootRowId]: true });
		table.setSorting([]);
		resetRowState();
	}, [resetRowState, rootRowId, table]);

	const expandToIteration = useCallback(
		(iterationId: number, columnId?: string) => {
			const model = table.getPreFilteredRowModel();
			const sortedIterations = model.flatRows.sort(
				(a, b) => getStartTirId(a.original) - getStartTirId(b.original)
			);

			let testContainingIteration: Row<RunData | MergedRun> | null = null;

			for (const iteration of sortedIterations) {
				if (getStartTirId(iteration.original) <= iterationId) {
					testContainingIteration = iteration;
				} else {
					break;
				}
			}

			if (!testContainingIteration) {
				console.warn(
					'Failed to find test containing iteration ID',
					iterationId
				);
				return;
			}

			const parents = testContainingIteration
				.getParentRows()
				.map((row) => row.id);

			table.setExpanded(
				toggleSubtree(true, [testContainingIteration.id, ...parents])
			);

			if (columnId) {
				updateRowState({
					rowId: testContainingIteration.id,
					requests: { [columnId]: getResultFilterForColumnId(columnId) }
				});
			}
		},
		[table, updateRowState]
	);

	return {
		expandUnexpected,
		showUnexpected,
		reset,
		expandToIteration
	} as const;
};
