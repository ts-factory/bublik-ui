/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { startOfDay, startOfWeek } from 'date-fns';
import { groupBy } from 'remeda';

import { getRunStatusInfo } from '@/shared/tailwind-ui';
import { RUN_STATUS } from '@/shared/types';

import { GroupedStats, RunStats, TestGroupedByWeek } from './runs-stats.types';

export const COLOR_MAP = new Map<string, string>([
	['ok', '#65cd84'],
	['nok', '#f95c78'],
	['total', '#7283e2']
]);

const getPassRate = (ok: number, total: number) => {
	if (total === 0) return 0;

	return Number(((ok / total) * 100).toFixed(2));
};

export const getPieChartDataForResults = (runStats: RunStats[]) => {
	type ObjectKeysWithType<T, U> = {
		[K in keyof T]: T[K] extends U ? K : never;
	};

	type KeysWithNumberValue<T> = ObjectKeysWithType<T, number>[keyof T];

	const calcTotal =
		(key: KeysWithNumberValue<RunStats>) =>
		(acc: { name: string; value: number }, curr: RunStats) => {
			acc.value += curr[key];
			return acc;
		};

	const ok = runStats.reduce(calcTotal('ok'), { name: 'OK', value: 0 });
	const nok = runStats.reduce(calcTotal('nok'), { name: 'NOK', value: 0 });

	return [ok, nok];
};

export const getPieChartDataByRunStatus = (stats: RunStats[]) => {
	const groupedByStatus = groupBy(stats, (stats) => stats.runStatus);

	return Object.entries(groupedByStatus).map(([status, stats]) => {
		const { label } = getRunStatusInfo(status as RUN_STATUS);

		return { name: label.toUpperCase(), value: stats.length };
	});
};

export const getGroupedByWeek = (stats: RunStats[]): TestGroupedByWeek[] => {
	const groupedBy = groupBy(stats, (stats) =>
		startOfWeek(stats.date).toISOString()
	);

	return Object.entries(groupedBy).map(([date, stats]) => {
		const nokNumber = stats.reduce((acc, curr) => acc + curr.nok, 0);
		const totalNumber = stats.reduce((acc, curr) => acc + curr.total, 0);
		const okNumber = stats.reduce((acc, curr) => acc + curr.ok, 0);

		return {
			date: new Date(date),
			total: totalNumber,
			ok: okNumber,
			nok: nokNumber,
			passrate: getPassRate(okNumber, totalNumber),
			ids: stats.map((s) => s.runId).join(',')
		};
	});
};

export const getGroupedByDay = (stats: RunStats[]): TestGroupedByWeek[] => {
	const groupedBy = groupBy(stats, (stats) =>
		startOfDay(stats.date).toISOString()
	);

	return Object.entries(groupedBy).map(([date, stats]) => {
		const nokNumber = stats.reduce((acc, curr) => acc + curr.nok, 0);
		const totalNumber = stats.reduce((acc, curr) => acc + curr.total, 0);
		const okNumber = stats.reduce((acc, curr) => acc + curr.ok, 0);

		return {
			date: new Date(date),
			total: totalNumber,
			ok: okNumber,
			nok: nokNumber,
			passrate: getPassRate(okNumber, totalNumber),
			ids: stats.map((s) => s.runId).join(',')
		};
	});
};

export const getRunStatus = (stats: RunStats[], group: 'day' | 'week') => {
	const grouped = groupBy(stats, (stats) =>
		group === 'week'
			? startOfWeek(stats.date).toISOString()
			: stats.date.toISOString()
	);

	const runStatusByWeek = Object.entries(grouped).reduce<GroupedStats[]>(
		(acc, [date, curr]) => {
			const runStatuses = curr.map((stats) => stats.runStatus);
			const uniqueRunStatuses = Array.from(new Set(runStatuses));

			const result = {
				date: new Date(date),
				[RUN_STATUS.Busy]: 0,
				[RUN_STATUS.Compromised]: 0,
				[RUN_STATUS.Error]: 0,
				[RUN_STATUS.Interrupted]: 0,
				[RUN_STATUS.Ok]: 0,
				[RUN_STATUS.Running]: 0,
				[RUN_STATUS.Stopped]: 0,
				[RUN_STATUS.Warning]: 0,
				ids: curr.map((c) => c.runId).join(',')
			} satisfies GroupedStats;

			uniqueRunStatuses.forEach(
				(runStatus) =>
					(result[runStatus] = runStatuses.filter(
						(v) => v === runStatus
					).length)
			);

			Object.values(RUN_STATUS).forEach((status) => {
				if (Object.keys(result).includes(status)) return;

				result[status] = 0;
			});

			return [...acc, result];
		},
		[]
	);

	const presentStatuses = Object.values(RUN_STATUS).filter((status) =>
		runStatusByWeek.some((st) => st[status] !== 0)
	);

	return { grouped: runStatusByWeek, statuses: presentStatuses };
};
