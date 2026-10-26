/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import { RUN_STATUS } from '@/shared/types';

import { RunsChartBucket } from './runs-stats.types';
import {
	fillBuckets,
	getPassrate,
	makeEmptyRunIdsByStatus,
	parseBucketDate
} from './runs-stats.utils';

const bucket = (
	date: Date,
	tests: Partial<RunsChartBucket['tests']> = {},
	ok: string[] = []
): RunsChartBucket => ({
	date,
	tests: { total: 10, ok: 8, nok: 2, passrate: 80, ...tests },
	runIdsByStatus: { ...makeEmptyRunIdsByStatus(), [RUN_STATUS.Ok]: ok }
});

describe('parseBucketDate', () => {
	it('keeps the calendar day of a UTC midnight timestamp', () => {
		const date = parseBucketDate('2026-10-19T00:00:00Z');

		expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([
			2026, 9, 19
		]);
		expect(date.getHours()).toBe(0);
	});
});

describe('getPassrate', () => {
	it('rounds to two decimals', () => {
		expect(getPassrate(2, 3)).toBe(66.67);
	});

	it('is null without tests', () => {
		expect(getPassrate(0, 0)).toBeNull();
	});
});

describe('fillBuckets', () => {
	it('adds empty days between buckets', () => {
		const filled = fillBuckets(
			[bucket(new Date(2026, 9, 1)), bucket(new Date(2026, 9, 4))],
			'day'
		);

		expect(filled.map((b) => b.date.getDate())).toEqual([1, 2, 3, 4]);
		expect(filled[1].tests).toEqual({
			total: 0,
			ok: 0,
			nok: 0,
			passrate: null
		});
		expect(filled[1].runIdsByStatus[RUN_STATUS.Ok]).toEqual([]);
	});

	it('steps weeks from Monday', () => {
		const filled = fillBuckets(
			[bucket(new Date(2026, 9, 5)), bucket(new Date(2026, 9, 19))],
			'week'
		);

		expect(filled.map((b) => b.date.getDate())).toEqual([5, 12, 19]);
	});

	it('widens to the selected range', () => {
		const filled = fillBuckets([bucket(new Date(2026, 9, 3))], 'day', {
			start: new Date(2026, 9, 1),
			end: new Date(2026, 9, 5)
		});

		expect(filled.map((b) => b.date.getDate())).toEqual([1, 2, 3, 4, 5]);
	});

	it('keeps buckets outside a narrower range', () => {
		const filled = fillBuckets(
			[bucket(new Date(2026, 9, 1)), bucket(new Date(2026, 9, 2))],
			'day',
			{ start: new Date(2026, 9, 2), end: new Date(2026, 9, 2) }
		);

		expect(filled).toHaveLength(2);
	});

	it('returns nothing for no buckets', () => {
		expect(fillBuckets([], 'day', { start: new Date() })).toEqual([]);
	});
});
