/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ExpandedState, Row } from '@tanstack/react-table';

import { NodeEntity, MergedRun, RunData } from '@/shared/types';
import { GlobalFilterValue, ColumnId } from '../types';

export const getRowCanExpand = (row: Row<RunData | MergedRun>) => {
	return !!row.subRows.length || row.original?.type === NodeEntity.Test;
};

export const isChild = (parentId: string, rowId: string) => {
	return rowId.startsWith(parentId);
};

export const isPackage = (type?: NodeEntity) => {
	return type !== NodeEntity.Test;
};

export const isTest = (type?: NodeEntity) => !isPackage(type);

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
