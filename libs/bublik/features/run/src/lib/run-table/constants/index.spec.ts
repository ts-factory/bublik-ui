/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import {
	createDefaultColumnOrder,
	createDefaultColumnVisibility,
	DEFAULT_COLUMN_ORDER,
	DEFAULT_COLUMN_VISIBILITY
} from '.';
import { ColumnId } from '../types';

describe('run table column defaults', () => {
	it('uses the static defaults when API default columns are absent', () => {
		expect(createDefaultColumnVisibility()).toEqual(DEFAULT_COLUMN_VISIBILITY);
		expect(createDefaultColumnOrder()).toEqual(DEFAULT_COLUMN_ORDER);
	});

	it('uses API default columns as visible columns', () => {
		expect(createDefaultColumnVisibility(['failed', 'passed', 'run'])).toEqual({
			[ColumnId.Total]: false,
			[ColumnId.Run]: true,
			[ColumnId.ExpectedTotal]: false,
			[ColumnId.UnexpectedTotal]: false,
			[ColumnId.PassedExpected]: true,
			[ColumnId.FailedExpected]: true,
			[ColumnId.PassedUnexpected]: false,
			[ColumnId.FailedUnexpected]: false,
			[ColumnId.SkippedExpected]: false,
			[ColumnId.SkippedUnexpected]: false,
			[ColumnId.Abnormal]: false,
			[ColumnId.Objective]: false,
			[ColumnId.Comments]: false
		});
	});

	it('preserves API default column order after the tree column', () => {
		expect(
			createDefaultColumnOrder(['failed', 'passed', 'run']).slice(0, 4)
		).toEqual([
			ColumnId.Tree,
			ColumnId.FailedExpected,
			ColumnId.PassedExpected,
			ColumnId.Run
		]);
	});

	it('appends missing configurable columns after API ordered columns', () => {
		expect(createDefaultColumnOrder(['failed', 'passed', 'run'])).toEqual([
			ColumnId.Tree,
			ColumnId.FailedExpected,
			ColumnId.PassedExpected,
			ColumnId.Run,
			ColumnId.Total,
			ColumnId.ExpectedTotal,
			ColumnId.UnexpectedTotal,
			ColumnId.PassedUnexpected,
			ColumnId.FailedUnexpected,
			ColumnId.SkippedExpected,
			ColumnId.SkippedUnexpected,
			ColumnId.Abnormal,
			ColumnId.Objective,
			ColumnId.Comments
		]);
	});

	it('deduplicates repeated API default columns', () => {
		expect(
			createDefaultColumnOrder(['run', 'passed', 'run']).slice(0, 3)
		).toEqual([ColumnId.Tree, ColumnId.Run, ColumnId.PassedExpected]);
	});
});
