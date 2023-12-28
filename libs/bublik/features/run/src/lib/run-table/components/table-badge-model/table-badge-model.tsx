/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC, MouseEvent } from 'react';
import { Row, Table } from '@tanstack/react-table';

import {
	NodeEntity,
	RESULT_PROPERTIES,
	RESULT_TYPE,
	RunData
} from '@/shared/types';
import { Badge, BadgeVariants, Icon } from '@/shared/tailwind-ui';

import { GlobalFilterValue, ColumnId } from '../../types';
import {
	add,
	doesRowHasMoreThanOneFilter,
	toggleSubtree,
	remove,
	isInFilter,
	createRequestRemover,
	createRequestAdder,
	toggleRowExpanded
} from '../../utils';
import { useRowsContext } from '../../context';
import { OpenTooltip } from '../open-tooltip';
import { RowState, useRunTableRowState } from '../../../hooks';

export interface TableBadgeModelProps {
	variant: BadgeVariants;
	columnId: ColumnId;
	results: RESULT_TYPE[];
	resultProperties?: RESULT_PROPERTIES[];

	row: Row<RunData>;
	table: Table<RunData>;
	value: number | string;
}

export const TableBadgeModel: FC<TableBadgeModelProps> = ({
	variant,
	columnId,
	results,
	resultProperties = [],
	row,
	table,
	value
}) => {
	const { rowState, updateRowState, deleteRows, updateRowsState } =
		useRunTableRowState();
	const { rowsIds, rowsValues } = useRowsContext();
	const { id: rowId } = row;
	const { getState, setGlobalFilter, setExpanded } = table;
	const isTest = row.original?.type === NodeEntity.Test;

	const { allIds, packageIds, testIds } = rowsIds[rowId];

	const globalFilter: GlobalFilterValue[] = getState().globalFilter;
	const isPackageInFilter = globalFilter.some(isInFilter(rowId, columnId));
	const hasMoreThanOneFilter = doesRowHasMoreThanOneFilter(rowId)(globalFilter);

	const isTestSelected = columnId in (rowState[rowId]?.requests || {});
	const isActive = isTestSelected || isPackageInFilter;

	/**
  |--------------------------------------------------
  | HANDLE RESULT
  |--------------------------------------------------
  */

	const removeRequest = createRequestRemover(columnId);
	const addRequest = createRequestAdder(columnId, {
		results,
		resultProperties
	});

	const openTest = () => {
		setExpanded(toggleRowExpanded(rowId, true));

		updateRowState({ rowId, requests: addRequest(rowState[rowId]?.requests) });
	};

	const closeTest = () => {
		const filterCount = Object.keys(rowState[rowId]?.requests || {}).length;
		const isRemovingLastFilter = isTestSelected && filterCount === 1;

		if (isRemovingLastFilter) setExpanded(toggleRowExpanded(rowId, false));

		updateRowState({
			rowId,
			requests: removeRequest(rowState[rowId]?.requests)
		});
	};

	const handleResultClick = () => {
		if (isTestSelected) {
			closeTest();
		} else {
			openTest();
		}
	};

	/**
  |--------------------------------------------------
  | HANDLE PACKAGE
  |--------------------------------------------------
  */

	const expandPackageSubtree = () => {
		setExpanded(toggleSubtree(true, packageIds));
		setGlobalFilter(add(rowId, columnId)(globalFilter));
	};

	const collapseSubtree = () => {
		deleteRows(testIds);
		setExpanded(toggleSubtree(false, allIds));
	};

	/**
  |--------------------------------------------------
  | CTRL
  |--------------------------------------------------
  */

	const handleCtrlCollapse = (ids: string[]) => {
		const newRowState: RowState[] = ids.map((id) => {
			const currentState = rowState[id]?.requests || {};

			return { rowId: id, requests: removeRequest(currentState) };
		});

		const toClose = newRowState
			.filter((row) => Object.keys(row.requests || {}).length === 0)
			.map((row) => row.rowId);

		updateRowsState(newRowState);
		setExpanded(toggleSubtree(false, toClose));
	};

	const handleCtrlExpand = () => {
		if (!isPackageInFilter) setGlobalFilter(add(rowId, columnId)(globalFilter));

		const filteredIds = testIds.filter((id) => rowsValues[id][columnId]);

		const newRowState: RowState[] = filteredIds.map((rowId) => {
			const currentState = rowState[rowId]?.requests || {};
			const newState = { rowId, requests: addRequest(currentState) };

			return newState;
		});

		const toOpen = [...packageIds, ...filteredIds];

		updateRowsState(newRowState);
		setExpanded(toggleSubtree(true, toOpen));
	};

	/**
  |--------------------------------------------------
  | WITHOUT CTRL
  |--------------------------------------------------
  */

	const handleWithoutControl = () => {
		if (!isPackageInFilter) return expandPackageSubtree();
		if (!hasMoreThanOneFilter) collapseSubtree();

		setGlobalFilter(remove(rowId, columnId)(globalFilter));
	};

	const handlePackageClick =
		(forceCtrl = false) =>
		(e: MouseEvent) => {
			// 1. Just open subtrees
			if (!e.ctrlKey && !forceCtrl) return handleWithoutControl();

			// 2. If rows with corresponding ids are open with results
			const rowsWithValue = testIds.filter((id) => rowsValues[id][columnId]);

			const isOpenAndInFilter = rowsWithValue.every(
				(rowId) => columnId in (rowState[rowId]?.requests || {})
			);

			if (isOpenAndInFilter) return handleCtrlCollapse(rowsWithValue);

			// 3. Open test rows
			handleCtrlExpand();
		};

	const handleClick = (e: MouseEvent) => {
		e.preventDefault();

		isTest ? handleResultClick() : handlePackageClick(false)(e);
	};

	if (rowId === '0' && value) {
		return (
			<div className="flex items-center gap-1">
				<Badge
					variant={variant}
					isSelected={isActive}
					onClick={handleClick}
					onContextMenu={handleClick}
				>
					{value}
				</Badge>
				<OpenTooltip onClick={handlePackageClick(true)}>
					<Icon
						name="InformationCircleQuestionMark"
						size={16}
						className="text-primary"
						aria-label="Expand results"
					/>
				</OpenTooltip>
			</div>
		);
	}

	// eslint-disable-next-line react/jsx-no-useless-fragment
	if (!value) return <>{0}</>;

	return (
		<Badge
			variant={variant}
			isSelected={isActive}
			onClick={handleClick}
			onContextMenu={handleClick}
		>
			{value}
		</Badge>
	);
};
