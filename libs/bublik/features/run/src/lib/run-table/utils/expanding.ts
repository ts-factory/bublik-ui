/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ExpandedState, Row, Table } from '@tanstack/react-table';

import { NodeEntity, MergedRun, RunData } from '@/shared/types';

import { GlobalFilterValue, ColumnId } from '../types';
import { containsUnexpected } from './unexpected';

export function isPackage(row: Row<RunData | MergedRun>) {
	return (
		row.original.type === NodeEntity.Package ||
		row.original.type === NodeEntity.Session ||
		row.original.type === NodeEntity.Suite
	);
}

export function isTest(row: Row<RunData | MergedRun>) {
	return row.original.type === NodeEntity.Test;
}

export const getRowCanExpand = (row: Row<RunData | MergedRun>) => {
	return !!row.subRows.length || isTest(row);
};

export const isChild = (
	parent: Row<RunData | MergedRun>,
	row: Row<RunData | MergedRun>
) => {
	return parent.subRows.some((child) => child.id === row.id);
};

export const isInFilter =
	(rowId: string, columnId: string) => (filterValue: GlobalFilterValue) => {
		return filterValue.columnId === columnId && filterValue.rowId === rowId;
	};

export const doesRowHasMoreThanOneFilter =
	(rowId: string) => (filters: GlobalFilterValue[]) => {
		return filters.filter((item) => item.rowId === rowId).length > 1;
	};

export const remove =
	(rowId: string, columnId: string) => (globalFilter: GlobalFilterValue[]) => {
		return globalFilter.filter(
			(filterValue) => !isInFilter(rowId, columnId)(filterValue)
		);
	};

export const add =
	(rowId: string, columnId: ColumnId) =>
	(globalFilter: GlobalFilterValue[]) => {
		return [...globalFilter, { rowId, columnId }];
	};

export function getPackageIdsWithUnexpected(table: Table<RunData | MergedRun>) {
	const model = table.getPreFilteredRowModel().flatRows;

	return model
		.filter(isPackage)
		.filter(containsUnexpected)
		.map((row) => row.id);
}

export function getAllTestIds(table: Table<RunData | MergedRun>) {
	const model = table.getPreFilteredRowModel().flatRows;

	return model.filter(isTest).map((row) => row.id);
}

export function getRootRowId(table: Table<RunData | MergedRun>) {
	const model = table.getPreFilteredRowModel().flatRows;

	return model[0]?.id;
}

export const toggleSubtree =
	(expandOrCollapse: boolean, rowIds: string[]) =>
	(oldState: ExpandedState) => {
		const newState: ExpandedState = {};

		rowIds.forEach((childId) => (newState[childId] = expandOrCollapse));

		if (!expandOrCollapse && '0' in newState) delete newState['0'];

		return { ...(oldState as Record<string, boolean>), ...newState };
	};

export const toggleRowExpanded =
	(rowId: string, expandOrCollapse: boolean) => (old: ExpandedState) => {
		return {
			...(old as Record<string, boolean>),
			[rowId]: expandOrCollapse
		};
	};

export function getAllPackageIdsRecursively(
	table: Table<RunData | MergedRun>,
	startRowId: string,
	filter: (row: Row<RunData | MergedRun>) => boolean
): string[] {
	const row = table.getPreFilteredRowModel().rowsById[startRowId];
	if (!row) return [];

	const packageIds: string[] = [];

	// If current row is a package, add it
	if (filter(row)) {
		packageIds.push(row.id);
	}

	// Recursively process all subRows
	if (row.subRows) {
		row.subRows.forEach((subRow) => {
			const childPackageIds = getAllPackageIdsRecursively(
				table,
				subRow.id,
				filter
			);
			packageIds.push(...childPackageIds);
		});
	}

	return packageIds;
}
