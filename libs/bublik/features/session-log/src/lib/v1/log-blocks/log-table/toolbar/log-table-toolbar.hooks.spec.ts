/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { Row } from '@tanstack/react-table';
import { describe, expect, test } from 'vitest';

import { LogTableData } from '@/shared/types';

import { getExpandedStateForErrorRows } from './log-table-toolbar.hooks';

interface CreateMockRowConfig {
	id: string;
	level: string;
	parentIds?: string[];
}

const createMockRow = (config: CreateMockRowConfig): Row<LogTableData> => {
	const { id, level, parentIds = [] } = config;

	const parentRows = parentIds.map(
		(parentId) => ({ id: parentId } as Row<LogTableData>)
	);

	return {
		id,
		original: { level } as LogTableData,
		getParentRows: () => parentRows
	} as Row<LogTableData>;
};

describe('getExpandedStateForErrorRows', () => {
	test('should keep all rows expanded state unchanged', () => {
		const rows = [
			createMockRow({
				id: '0_42',
				level: 'ERROR',
				parentIds: ['0_1', '0_2']
			})
		];

		expect(getExpandedStateForErrorRows(rows, true)).toBe(true);
	});

	test('should expand all parents for deep error rows', () => {
		const rows = [
			createMockRow({ id: '0_11', level: 'INFO', parentIds: ['0_1'] }),
			createMockRow({
				id: '0_42',
				level: 'ERROR',
				parentIds: ['0_1', '0_2', '0_5']
			}),
			createMockRow({
				id: '0_53',
				level: 'ERROR',
				parentIds: ['0_1', '0_9']
			})
		];

		expect(getExpandedStateForErrorRows(rows, { '0_7': true })).toEqual({
			'0_1': true,
			'0_2': true,
			'0_5': true,
			'0_7': true,
			'0_9': true
		});
	});

	test('should return original state if all error ancestors are already expanded', () => {
		const currentExpanded = { '0_1': true, '0_2': true };
		const rows = [
			createMockRow({
				id: '0_42',
				level: 'ERROR',
				parentIds: ['0_1', '0_2']
			})
		];

		const result = getExpandedStateForErrorRows(rows, currentExpanded);

		expect(result).toBe(currentExpanded);
	});
});
