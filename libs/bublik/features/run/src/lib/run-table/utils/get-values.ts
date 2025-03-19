/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Row } from '@tanstack/react-table';

import { MergedRun, RunData } from '@/shared/types';

import { RowDecription } from '../context';
import { isChild, isPackage, isTest } from './expanding';

export const getRowValues = (row: Row<RunData | MergedRun>) => {
	const values: Record<string, number> = {};

	row?.getAllCells().forEach((cell) => {
		values[cell.column.id] = row.getValue(cell.column.id);
	});

	return values;
};

export const getRowsValuesById = (
	rawRawsById: Record<string, Row<RunData | MergedRun>>
) => {
	const rowsById = Object.entries(rawRawsById);

	const valuesById = rowsById.reduce(
		(acc, [rowId, row]) => ({ ...acc, [rowId]: getRowValues(row) }),
		{}
	);

	return valuesById;
};

const packageFilter =
	(originalRow: Row<RunData | MergedRun>) =>
	(row: Row<RunData | MergedRun>) => {
		return isChild(originalRow, row) && isPackage(row);
	};

const testFilter =
	(originalRow: Row<RunData | MergedRun>) =>
	(row: Row<RunData | MergedRun>) => {
		return isChild(originalRow, row) && isTest(row);
	};

export const getRowsDescriptionById = (
	rows: Row<RunData | MergedRun>[]
): Record<string, RowDecription> => {
	const result: Record<string, RowDecription> = {};

	rows.forEach((row) => {
		const packageIds = rows.filter(packageFilter(row)).map((row) => row.id);
		const testIds = rows.filter(testFilter(row)).map((row) => row.id);
		const allIds = [...packageIds, ...testIds];

		result[row.id] = { allIds, packageIds, testIds };
	});

	return result;
};
