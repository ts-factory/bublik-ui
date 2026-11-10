/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import {
	createDefaultColumnOrder,
	createDefaultColumnVisibility,
	DEFAULT_COLUMN_ORDER,
	DEFAULT_COLUMN_VISIBILITY,
	reconcileColumnOrder
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

	it('preserves API default column order after the leading columns', () => {
		expect(
			createDefaultColumnOrder(['failed', 'passed', 'run']).filter((id) =>
				[
					ColumnId.FailedExpected,
					ColumnId.PassedExpected,
					ColumnId.Run
				].includes(id)
			)
		).toEqual([ColumnId.FailedExpected, ColumnId.PassedExpected, ColumnId.Run]);
	});

	it('places unlisted columns beside their group, else at the end', () => {
		expect(createDefaultColumnOrder(['failed', 'passed', 'run'])).toEqual([
			ColumnId.Tree,
			ColumnId.Objective,
			ColumnId.Comments,
			ColumnId.ExpectedTotal,
			ColumnId.FailedExpected,
			ColumnId.PassedExpected,
			ColumnId.Total,
			ColumnId.Run,
			ColumnId.UnexpectedTotal,
			ColumnId.PassedUnexpected,
			ColumnId.FailedUnexpected,
			ColumnId.SkippedExpected,
			ColumnId.SkippedUnexpected,
			ColumnId.Abnormal
		]);
	});

	it('places an unlisted column after the group mates it follows', () => {
		expect(
			createDefaultColumnOrder(['run', 'passed_unexpected', 'abnormal'])
		).toEqual([
			ColumnId.Tree,
			ColumnId.Objective,
			ColumnId.Comments,
			ColumnId.Total,
			ColumnId.Run,
			ColumnId.UnexpectedTotal,
			ColumnId.PassedUnexpected,
			ColumnId.FailedUnexpected,
			ColumnId.Abnormal,
			ColumnId.ExpectedTotal,
			ColumnId.PassedExpected,
			ColumnId.FailedExpected,
			ColumnId.SkippedExpected,
			ColumnId.SkippedUnexpected
		]);
	});

	it('leads each group with its total in the static default', () => {
		expect(DEFAULT_COLUMN_ORDER).toEqual([
			ColumnId.Tree,
			ColumnId.Objective,
			ColumnId.Comments,
			ColumnId.Total,
			ColumnId.Run,
			ColumnId.ExpectedTotal,
			ColumnId.PassedExpected,
			ColumnId.FailedExpected,
			ColumnId.UnexpectedTotal,
			ColumnId.PassedUnexpected,
			ColumnId.FailedUnexpected,
			ColumnId.SkippedExpected,
			ColumnId.SkippedUnexpected,
			ColumnId.Abnormal
		]);
	});

	it('keeps Objective and Notes first and totals with their groups for the backend default', () => {
		expect(
			createDefaultColumnOrder([
				'run',
				'passed',
				'failed',
				'passed_unexpected',
				'failed_unexpected',
				'skipped',
				'skipped_unexpected',
				'abnormal'
			])
		).toEqual([
			ColumnId.Tree,
			ColumnId.Objective,
			ColumnId.Comments,
			ColumnId.Total,
			ColumnId.Run,
			ColumnId.ExpectedTotal,
			ColumnId.PassedExpected,
			ColumnId.FailedExpected,
			ColumnId.UnexpectedTotal,
			ColumnId.PassedUnexpected,
			ColumnId.FailedUnexpected,
			ColumnId.SkippedExpected,
			ColumnId.SkippedUnexpected,
			ColumnId.Abnormal
		]);
	});

	it('keeps the configured position of Objective and Notes', () => {
		expect(
			createDefaultColumnOrder(['run', 'objective', 'comments']).slice(0, 5)
		).toEqual([
			ColumnId.Tree,
			ColumnId.Total,
			ColumnId.Run,
			ColumnId.Objective,
			ColumnId.Comments
		]);
	});

	it('leads with only the unlisted one of Objective and Notes', () => {
		expect(createDefaultColumnOrder(['run', 'objective']).slice(0, 5)).toEqual([
			ColumnId.Tree,
			ColumnId.Comments,
			ColumnId.Total,
			ColumnId.Run,
			ColumnId.Objective
		]);
	});

	it('deduplicates repeated API default columns', () => {
		expect(
			createDefaultColumnOrder(['run', 'passed', 'run']).slice(0, 7)
		).toEqual([
			ColumnId.Tree,
			ColumnId.Objective,
			ColumnId.Comments,
			ColumnId.Total,
			ColumnId.Run,
			ColumnId.ExpectedTotal,
			ColumnId.PassedExpected
		]);
	});
});

describe('reconcileColumnOrder', () => {
	const defaultOrder = createDefaultColumnOrder();

	it('falls back to the default order when nothing is saved', () => {
		expect(reconcileColumnOrder(undefined, defaultOrder)).toEqual(defaultOrder);
		expect(reconcileColumnOrder([], defaultOrder)).toEqual(defaultOrder);
	});

	it('preserves a valid saved order', () => {
		const saved = [
			ColumnId.Tree,
			ColumnId.Comments,
			ColumnId.Objective,
			ColumnId.Total,
			ColumnId.Run,
			ColumnId.ExpectedTotal,
			ColumnId.UnexpectedTotal,
			ColumnId.PassedExpected,
			ColumnId.FailedExpected,
			ColumnId.PassedUnexpected,
			ColumnId.FailedUnexpected,
			ColumnId.SkippedExpected,
			ColumnId.SkippedUnexpected,
			ColumnId.Abnormal
		];

		expect(reconcileColumnOrder(saved, defaultOrder)).toEqual(saved);
	});

	it('drops saved columns that are no longer available', () => {
		const saved = [ColumnId.Run, 'LEGACY_COLUMN' as ColumnId, ColumnId.Total];

		const result = reconcileColumnOrder(saved, defaultOrder);

		expect(result).not.toContain('LEGACY_COLUMN');
		expect(result.slice(0, 3)).toEqual([
			ColumnId.Tree,
			ColumnId.Run,
			ColumnId.Total
		]);
	});

	it('appends newly available columns in their default position', () => {
		const saved = [ColumnId.Run, ColumnId.Total];

		const result = reconcileColumnOrder(saved, defaultOrder);

		expect(result.slice(0, 3)).toEqual([
			ColumnId.Tree,
			ColumnId.Run,
			ColumnId.Total
		]);
		// every default column still present exactly once
		expect(new Set(result)).toEqual(new Set(defaultOrder));
		expect(result.length).toBe(defaultOrder.length);
	});

	it('always pins the tree column first', () => {
		const saved = [ColumnId.Run, ColumnId.Tree, ColumnId.Total];

		const result = reconcileColumnOrder(saved, defaultOrder);

		expect(result[0]).toBe(ColumnId.Tree);
		expect(result.filter((id) => id === ColumnId.Tree)).toHaveLength(1);
	});
});
