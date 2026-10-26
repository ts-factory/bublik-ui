/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import { RUN_STATUS } from '@/shared/types';

import { RunsChartBucket } from './runs-stats.types';
import {
	fillBuckets,
	formatPeriodRange,
	getPassrate,
	getPeriodEnd,
	groupBuckets,
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

describe('groupBuckets', () => {
	const days = [
		bucket(new Date(2026, 9, 19), { total: 10, ok: 10, nok: 0 }, ['1']),
		bucket(new Date(2026, 9, 25), { total: 10, ok: 5, nok: 5 }, ['2']),
		bucket(new Date(2026, 9, 26), { total: 20, ok: 20, nok: 0 }, ['3'])
	];

	it('sums days into Monday weeks', () => {
		const weeks = groupBuckets(days, 'week');

		expect(weeks.map((b) => b.date.getDate())).toEqual([19, 26]);
		expect(weeks[0].tests).toEqual({
			total: 20,
			ok: 15,
			nok: 5,
			passrate: 75
		});
		expect(weeks[0].runIdsByStatus[RUN_STATUS.Ok]).toEqual(['1', '2']);
	});

	it('sums days into months', () => {
		const [month] = groupBuckets(days, 'month');

		expect(month.date).toEqual(new Date(2026, 9, 1));
		expect(month.tests.total).toBe(40);
		expect(month.runIdsByStatus[RUN_STATUS.Ok]).toEqual(['1', '2', '3']);
	});

	it('leaves the source buckets alone', () => {
		groupBuckets(days, 'month');

		expect(days[0].runIdsByStatus[RUN_STATUS.Ok]).toEqual(['1']);
		expect(days[0].tests.total).toBe(10);
	});
});

describe('getPeriodEnd', () => {
	it('ends a week on Sunday and a month on its last day', () => {
		expect(getPeriodEnd(new Date(2026, 9, 19), 'week')).toEqual(
			new Date(2026, 9, 25)
		);
		expect(getPeriodEnd(new Date(2026, 1, 1), 'month')).toEqual(
			new Date(2026, 1, 28)
		);
		expect(getPeriodEnd(new Date(2026, 9, 19), 'day')).toEqual(
			new Date(2026, 9, 19)
		);
	});
});

describe('formatPeriodRange', () => {
	it('names the days a period covers', () => {
		expect(formatPeriodRange(new Date(2026, 3, 20), 'week')).toBe(
			'Apr 20 – 26, 2026'
		);
		expect(formatPeriodRange(new Date(2026, 3, 27), 'week')).toBe(
			'Apr 27 – May 3, 2026'
		);
		expect(formatPeriodRange(new Date(2026, 11, 28), 'week')).toBe(
			'Dec 28, 2026 – Jan 3, 2027'
		);
		expect(formatPeriodRange(new Date(2026, 3, 1), 'month')).toBe(
			'Apr 1 – 30, 2026'
		);
		expect(formatPeriodRange(new Date(2026, 3, 20), 'day')).toBe(
			'Mon, Apr 20, 2026'
		);
	});
});
