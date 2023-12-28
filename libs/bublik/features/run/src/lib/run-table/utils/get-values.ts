/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Row } from '@tanstack/react-table';

import { RunData } from '@/shared/types';

import { RowDecription } from '../context';
import { isChild, isPackage, isTest } from './expanding';

export const getRowValues = (row: Row<RunData>) => {
	const values: Record<string, number> = {};

	row.getAllCells().forEach((cell) => {
		values[cell.column.id] = row.getValue(cell.column.id);
	});

	return values;
};

export const getRowsValuesById = (
	rawRawsById: Record<string, Row<RunData>>
) => {
	const rowsById = Object.entries(rawRawsById);

	const valuesById = rowsById.reduce(
		(acc, [rowId, row]) => ({ ...acc, [rowId]: getRowValues(row) }),
		{}
	);

	return valuesById;
};

const packageFilter = (originalRow: Row<RunData>) => (row: Row<RunData>) => {
	return isChild(originalRow.id, row.id) && isPackage(row.original?.type);
};

const testFilter = (originalRow: Row<RunData>) => (row: Row<RunData>) => {
	return isChild(originalRow.id, row.id) && isTest(row.original?.type);
};

export const getRowsDescriptionById = (
	rows: Row<RunData>[]
): Record<string, RowDecription> => {
	const result: Record<string, RowDecription> = {};

	rows.forEach((originalRowId) => {
		const packageIds = rows
			.filter(packageFilter(originalRowId))
			.map((row) => row.id);

		const testIds = rows.filter(testFilter(originalRowId)).map((row) => row.id);

		const allIds = [...packageIds, ...testIds];

		result[originalRowId.id] = { allIds, packageIds, testIds };
	});

	return result;
};
