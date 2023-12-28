/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { RunData } from '@/shared/types';
import { FilterFn, Row } from '@tanstack/react-table';

import { GlobalFilterValue } from '../types';

const isChild = (rowId: string) => (filterValue: GlobalFilterValue) => {
	return rowId.startsWith(filterValue.rowId);
};

const applyGlobalFilter =
	(filters: GlobalFilterValue[]) => (row: Row<RunData>) => {
		const isPresentInSomeParent = filters.some(isChild(row.id));

		// We handle only subtrees moving on (strict checking)
		if (!isPresentInSomeParent) return true;

		const columnsForCheck = filters.map((filter) => filter.columnId);

		return columnsForCheck.some((columnId) => !!row.getValue(columnId));
	};

export const globalFilterFn: FilterFn<RunData> = (
	row,
	_columnId,
	filters: GlobalFilterValue[]
) => {
	if (!filters.length) return true;

	return applyGlobalFilter(filters)(row);
};
