/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import {
	addDays,
	addMonths,
	addWeeks,
	isValid,
	startOfDay,
	startOfISOWeek,
	startOfMonth
} from 'date-fns';

import { RUN_STATUS } from '@/shared/types';

import { RunIdsByStatus, RunsChartBucket } from './runs-stats.types';

const RUNS_CHART_PERIODS = ['day', 'week', 'month'] as const;

type RunsChartPeriod = (typeof RUNS_CHART_PERIODS)[number];

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
	if (period === 'month') return startOfMonth(date);

	// Weeks start on Monday, as they do in the API
	if (period === 'week') return startOfISOWeek(date);

	return startOfDay(date);
}

function addPeriod(date: Date, period: RunsChartPeriod): Date {
	if (period === 'month') return addMonths(date, 1);

	if (period === 'week') return addWeeks(date, 1);

	return addDays(date, 1);
}

function makeEmptyBucket(date: Date): RunsChartBucket {
	return {
		date,
		tests: { total: 0, ok: 0, nok: 0, passrate: null },
		runIdsByStatus: makeEmptyRunIdsByStatus()
	};
}

/** Merges daily buckets into the periods that contain them */
function groupBuckets(
	buckets: RunsChartBucket[],
	period: RunsChartPeriod
): RunsChartBucket[] {
	const byTime = new Map<number, RunsChartBucket>();

	for (const bucket of buckets) {
		const date = getPeriodStart(bucket.date, period);
		const merged = byTime.get(date.getTime()) ?? makeEmptyBucket(date);

		merged.tests.total += bucket.tests.total;
		merged.tests.ok += bucket.tests.ok;
		merged.tests.nok += bucket.tests.nok;
		merged.tests.passrate = getPassrate(merged.tests.ok, merged.tests.total);

		for (const status of Object.values(RUN_STATUS)) {
			merged.runIdsByStatus[status].push(...bucket.runIdsByStatus[status]);
		}

		byTime.set(date.getTime(), merged);
	}

	return [...byTime.values()].sort(
		(left, right) => left.date.getTime() - right.date.getTime()
	);
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
	RUNS_CHART_PERIODS,
	type RunsChartPeriod,
	fillBuckets,
	groupBuckets,
	getPassrate,
	getPeriodStart,
	makeEmptyRunIdsByStatus,
	parseBucketDate
};
