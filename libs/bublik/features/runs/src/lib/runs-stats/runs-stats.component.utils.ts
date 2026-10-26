/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { RUN_STATUS } from '@/shared/types';

import { RunIdsByStatus, RunsChartBucket } from './runs-stats.types';

export const COLOR_MAP = new Map<string, string>([
	['ok', '#65cd84'],
	['nok', '#f95c78'],
	// --colors-primary: the chart has no run conclusions to confuse it with
	['passrate', '#6080fb']
]);

export const getRunIdsFromStatuses = (idsByStatus: RunIdsByStatus) =>
	Object.values(idsByStatus).flat();

/** A clicked chart mark: one conclusion, one period, or both */
export interface RunsChartSelection {
	status?: RUN_STATUS;
	bucket?: RunsChartBucket;
}

export const getSelectionRunIds = (
	stats: RunsChartBucket[],
	{ status, bucket }: RunsChartSelection
): string[] => {
	const buckets = bucket ? [bucket] : stats;

	return buckets.flatMap((item) =>
		status
			? item.runIdsByStatus[status]
			: getRunIdsFromStatuses(item.runIdsByStatus)
	);
};

export interface RunsChartSummary {
	runs: number;
	tests: number;
	ok: number;
	nok: number;
	passrate: number | null;
}

export const getSummary = (stats: RunsChartBucket[]): RunsChartSummary => {
	const runs = stats.reduce(
		(total, bucket) =>
			total + getRunIdsFromStatuses(bucket.runIdsByStatus).length,
		0
	);
	const tests = stats.reduce((total, bucket) => total + bucket.tests.total, 0);
	const ok = stats.reduce((total, bucket) => total + bucket.tests.ok, 0);
	const nok = stats.reduce((total, bucket) => total + bucket.tests.nok, 0);

	return { runs, tests, ok, nok, passrate: tests ? (ok * 100) / tests : null };
};
