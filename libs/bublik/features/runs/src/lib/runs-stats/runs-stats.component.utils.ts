/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { getRunStatusInfo } from '@/shared/tailwind-ui';
import { RUN_STATUS } from '@/shared/types';

import {
	GroupedStats,
	RunIdsByStatus,
	RunsChartBucket,
	TestGroupedByDate
} from './runs-stats.types';

export const COLOR_MAP = new Map<string, string>([
	['ok', '#65cd84'],
	['nok', '#f95c78'],
	['total', '#7283e2']
]);

export const getRunIdsFromStatuses = (idsByStatus: RunIdsByStatus) =>
	Object.values(idsByStatus).flat();

export const getPieChartDataForResults = (buckets: RunsChartBucket[]) => {
	const ok = buckets.reduce(
		(acc, curr) => ({ ...acc, value: acc.value + curr.tests.ok }),
		{ name: 'OK', value: 0 }
	);
	const nok = buckets.reduce(
		(acc, curr) => ({ ...acc, value: acc.value + curr.tests.nok }),
		{ name: 'NOK', value: 0 }
	);

	return [ok, nok];
};

export const getPieChartDataByRunStatus = (buckets: RunsChartBucket[]) => {
	return Object.values(RUN_STATUS)
		.map((status) => {
			const { label } = getRunStatusInfo(status);
			const value = buckets.reduce(
				(acc, bucket) => acc + bucket.runIdsByStatus[status].length,
				0
			);

			return { name: label.toUpperCase(), value, status };
		})
		.filter(({ value }) => value > 0);
};

export const getGroupedTests = (
	buckets: RunsChartBucket[]
): TestGroupedByDate[] => {
	return buckets.map((bucket) => {
		return {
			date: bucket.date,
			total: bucket.tests.total,
			ok: bucket.tests.ok,
			nok: bucket.tests.nok,
			passrate: bucket.tests.passrate,
			ids: getRunIdsFromStatuses(bucket.runIdsByStatus).join(',')
		};
	});
};

export const getRunStatus = (buckets: RunsChartBucket[]) => {
	const grouped = buckets.map((bucket) => {
		return {
			date: bucket.date,
			[RUN_STATUS.Busy]: bucket.runIdsByStatus[RUN_STATUS.Busy].length,
			[RUN_STATUS.Compromised]:
				bucket.runIdsByStatus[RUN_STATUS.Compromised].length,
			[RUN_STATUS.Error]: bucket.runIdsByStatus[RUN_STATUS.Error].length,
			[RUN_STATUS.Interrupted]:
				bucket.runIdsByStatus[RUN_STATUS.Interrupted].length,
			[RUN_STATUS.Ok]: bucket.runIdsByStatus[RUN_STATUS.Ok].length,
			[RUN_STATUS.Running]: bucket.runIdsByStatus[RUN_STATUS.Running].length,
			[RUN_STATUS.Stopped]: bucket.runIdsByStatus[RUN_STATUS.Stopped].length,
			[RUN_STATUS.Warning]: bucket.runIdsByStatus[RUN_STATUS.Warning].length,
			ids: getRunIdsFromStatuses(bucket.runIdsByStatus).join(',')
		} satisfies GroupedStats;
	});

	const presentStatuses = Object.values(RUN_STATUS).filter((status) =>
		grouped.some((st) => st[status] !== 0)
	);

	return { grouped, statuses: presentStatuses };
};
