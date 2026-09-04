/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import { ColumnsParam } from './classification-table.params';

describe('ColumnsParam', () => {
	it('stays out of the URL when nothing has been chosen', () => {
		expect(ColumnsParam.encode({})).toBeUndefined();
	});

	it('writes a sign per column, sorted so one choice is one URL', () => {
		expect(ColumnsParam.encode({ verdicts: true, active: false })).toBe(
			'-active;+verdicts'
		);
		expect(ColumnsParam.encode({ active: false, verdicts: true })).toBe(
			'-active;+verdicts'
		);
	});

	it('round-trips', () => {
		const overrides = { tags: false, verdicts: true };

		expect(ColumnsParam.decode(ColumnsParam.encode(overrides))).toEqual(
			overrides
		);
	});

	it('reads an absent or empty param as no choices at all', () => {
		expect(ColumnsParam.decode(undefined)).toEqual({});
		expect(ColumnsParam.decode('')).toEqual({});
	});

	it('ignores entries without a sign rather than guessing', () => {
		expect(ColumnsParam.decode('tags;+verdicts;-')).toEqual({ verdicts: true });
	});

	it('takes the first value when the param is repeated', () => {
		expect(ColumnsParam.decode(['-tags', '+verdicts'])).toEqual({ tags: false });
	});
});
