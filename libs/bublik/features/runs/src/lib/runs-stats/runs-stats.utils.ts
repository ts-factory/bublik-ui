/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import {
	addDays,
	addWeeks,
	isValid,
	startOfDay,
	startOfISOWeek
} from 'date-fns';

import { RUN_STATUS } from '@/shared/types';

import { RunIdsByStatus, RunsChartBucket } from './runs-stats.types';

type RunsChartPeriod = 'day' | 'week';

const makeEmptyRunIdsByStatus = (): RunIdsByStatus => ({
	[RUN_STATUS.Busy]: [],
	[RUN_STATUS.Compromised]: [],
	[RUN_STATUS.Error]: [],
	[RUN_STATUS.Interrupted]: [],
	[RUN_STATUS.Ok]: [],
	[RUN_STATUS.Running]: [],
	[RUN_STATUS.Stopped]: [],
	[RUN_STATUS.Warning]: []
});

/**
 * The API sends a bucket as UTC midnight of its calendar day. Read as an
 * instant it lands on the previous day west of UTC, so only the calendar date
 * is kept, at local midnight.
 */
function parseBucketDate(value: string): Date {
	const [year, month, day] = value.slice(0, 10).split('-').map(Number);

	return new Date(year, month - 1, day);
}

/** Pass rate in percent, or null when the bucket has no tests to rate */
function getPassrate(ok: number, total: number): number | null {
	if (!total) return null;

	return Math.round((ok * 10000) / total) / 100;
}

function getPeriodStart(date: Date, period: RunsChartPeriod): Date {
	return period === 'week' ? startOfISOWeek(date) : startOfDay(date);
}

function addPeriod(date: Date, period: RunsChartPeriod): Date {
	return period === 'week' ? addWeeks(date, 1) : addDays(date, 1);
}

function makeEmptyBucket(date: Date): RunsChartBucket {
	return {
		date,
		tests: { total: 0, ok: 0, nok: 0, passrate: null },
		runIdsByStatus: makeEmptyRunIdsByStatus()
	};
}

interface FillBucketsRange {
	start?: Date;
	end?: Date;
}

/**
 * Lists every period between the first and the last bucket, or across the
 * selected range when it is wider, so periods without runs show as gaps
 * instead of being bridged by the lines.
 */
function fillBuckets(
	buckets: RunsChartBucket[],
	period: RunsChartPeriod,
	range: FillBucketsRange = {}
): RunsChartBucket[] {
	if (!buckets.length) return [];

	const byTime = new Map(
		buckets.map((bucket) => [
			getPeriodStart(bucket.date, period).getTime(),
			bucket
		])
	);
	const times = [...byTime.keys()];
	const candidatesStart = [Math.min(...times)];
	const candidatesEnd = [Math.max(...times)];

	if (range.start && isValid(range.start)) {
		candidatesStart.push(getPeriodStart(range.start, period).getTime());
	}

	if (range.end && isValid(range.end)) {
		candidatesEnd.push(getPeriodStart(range.end, period).getTime());
	}

	const end = Math.max(...candidatesEnd);
	const filled: RunsChartBucket[] = [];

	for (
		let date = new Date(Math.min(...candidatesStart));
		date.getTime() <= end;
		date = addPeriod(date, period)
	) {
		filled.push(byTime.get(date.getTime()) ?? makeEmptyBucket(date));
	}

	return filled;
}

export {
	type RunsChartPeriod,
	fillBuckets,
	getPassrate,
	getPeriodStart,
	makeEmptyRunIdsByStatus,
	parseBucketDate
};
