/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Row } from '@tanstack/react-table';

import {
	DashboardAPIResponse,
	DashboardCellArray,
	DashboardData,
	RUN_STATUS
} from '@/shared/types';

import { getColorFromContext } from '../utils';

export const isRowError = (row: Row<DashboardData>) => {
	return row.original.context.conclusion === RUN_STATUS.Error;
};

export const getColumnWidth = (
	rows: DashboardData[],
	accessor: string,
	headerText: string
) => {
	const MAX_WIDTH = 400;
	const MAGIC_SPACING = 14;

	const maxLengthInColumn = getMaxLengthInColumn(rows, accessor);
	const maxLength = Math.max(maxLengthInColumn, headerText.length);

	return Math.min(MAX_WIDTH, maxLength * MAGIC_SPACING + 128);
};

export const getMaxLengthInColumn = (
	rows: DashboardData[],
	accessor: string
) => {
	return rows.reduce((acc, curr) => {
		const data = curr.row_cells[accessor];

		if (Array.isArray(data)) {
			return Math.max(acc, getCellStrFromArray(data).length);
		}

		const length = data?.value?.toString()?.length ?? 0;

		return Math.max(acc, length);
	}, 0);
};

export const getCellStrFromArray = (arr: DashboardCellArray[]) => {
	return arr
		.map((data) => data.value)
		.filter((str) => str)
		.join(', ');
};

export const createColorMap = (
	rows: DashboardAPIResponse['rows'] | DashboardData
) => {
	const colorMap = new Map<string, string>();
	const maybeRandomRow = Array.isArray(rows)
		? rows[Math.floor(Math.random() * rows.length)]?.row_cells
		: rows.row_cells;

	const getColorByKey = (key: string) => colorMap.get(key);

	const api = { getColorByKey };

	if (!maybeRandomRow) return api;

	Object.entries(maybeRandomRow)
		.filter(([, cell]) => !Array.isArray(cell) && cell.payload)
		.forEach(([key, cell], idx) => {
			if (Array.isArray(cell)) return;

			if (cell.context) {
				return colorMap.set(key, getColorFromContext(cell.context));
			}

			colorMap.set(key, `bg-badge-${idx}`);
		});

	return api;
};
