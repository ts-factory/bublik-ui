/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import type { ECElementEvent } from 'echarts';
import type ReactEChartsCore from 'echarts-for-react/lib/core';
import { useQueryParam } from 'use-query-params';

import {
	RUN_STATUS,
	RunsChartsAPIQuery,
	RunsChartsAPIResponse
} from '@/shared/types';
import { useGetRunsChartsQuery } from '@/services/bublik-api';
import { parseTimeApi } from '@/shared/utils';

import { useRunsQuery } from '../hooks';
import { RunIdsByStatus, RunsChartBucket } from './runs-stats.types';
import { PeriodParam } from './runs-stats.params';
import {
	RunsChartPeriod,
	fillBuckets,
	getPassrate,
	groupBuckets,
	makeEmptyRunIdsByStatus,
	parseBucketDate
} from './runs-stats.utils';

const toRunIdsByStatus = (
	runIdsByStatus: Partial<Record<RUN_STATUS, number[]>>
): RunIdsByStatus => {
	const result = makeEmptyRunIdsByStatus();

	Object.values(RUN_STATUS).forEach((status) => {
		result[status] = runIdsByStatus[status]?.map(String) ?? [];
	});

	return result;
};

const mapBuckets = (
	buckets: RunsChartsAPIResponse['buckets']
): RunsChartBucket[] =>
	buckets.map(({ date, tests, run_ids_by_status }) => ({
		date: parseBucketDate(date),
		tests: { ...tests, passrate: getPassrate(tests.ok, tests.total) },
		runIdsByStatus: toRunIdsByStatus(run_ids_by_status)
	}));

const parseRangeDate = (value?: string | null) =>
	value ? parseTimeApi(value) : undefined;

const toStats = (
	data: RunsChartsAPIResponse | undefined,
	period: RunsChartPeriod,
	range: { start?: Date; end?: Date }
) =>
	data
		? fillBuckets(groupBuckets(mapBuckets(data.buckets), period), period, range)
		: undefined;

export const useRunsChartPeriod = () => useQueryParam('period', PeriodParam);

export const useRunsStats = () => {
	const { query: searchQuery } = useRunsQuery();

	const chartsQuery = useMemo<RunsChartsAPIQuery>(
		() => ({
			startDate: searchQuery.startDate,
			finishDate: searchQuery.finishDate,
			runData: searchQuery.runData,
			tagExpr: searchQuery.tagExpr,
			projects: searchQuery.projects
		}),
		[
			searchQuery.finishDate,
			searchQuery.projects,
			searchQuery.runData,
			searchQuery.startDate,
			searchQuery.tagExpr
		]
	);

	const range = useMemo(
		() => ({
			start: parseRangeDate(searchQuery.startDate),
			end: parseRangeDate(searchQuery.finishDate)
		}),
		[searchQuery.finishDate, searchQuery.startDate]
	);

	const [period] = useRunsChartPeriod();
	// Weeks and months are summed up from days, so one request serves them all
	const dayQuery = useGetRunsChartsQuery({ ...chartsQuery, groupBy: 'day' });

	const stats = useMemo(
		() => toStats(dayQuery.data, period, range),
		[dayQuery.data, period, range]
	);

	return {
		isLoading: dayQuery.isLoading,
		isFetching: dayQuery.isFetching,
		stats,
		period,
		error: dayQuery.error
	} as const;
};

interface ChartEventHandlers {
	onClick: (params: ECElementEvent) => void;
	onDataZoom?: () => void;
	onAxisPointer?: (params: AxisPointerEvent) => void;
}

/** What ECharts sends with `updateAxisPointer`; for a category axis the value is the index */
export interface AxisPointerEvent {
	axesInfo?: { axisDim: string; value: number }[];
}

/**
 * Chart events that stay the same object across renders: the chart is
 * disposed and created anew whenever its `onEvents` change.
 */
export const useChartEvents = (handlers: ChartEventHandlers) => {
	const handlersRef = useRef(handlers);

	useLayoutEffect(() => {
		handlersRef.current = handlers;
	});

	return useMemo(
		() => ({
			click: (params: ECElementEvent) => handlersRef.current.onClick(params),
			datazoom: () => handlersRef.current.onDataZoom?.(),
			updateAxisPointer: (params: AxisPointerEvent) =>
				handlersRef.current.onAxisPointer?.(params)
		}),
		[]
	);
};

interface DataZoomOption {
	start?: number;
	end?: number;
}

/**
 * Keeps the timelines in step: zooming one zooms the others, and hovering a
 * period shows the same period's tooltip in each. ECharts' own `connect`
 * would also pass legend clicks between them by series name, and both have
 * an OK series.
 */
export const useLinkedTimelines = () => {
	const chartsRef = useRef(new Map<string, ReactEChartsCore | null>());
	const refCallbacksRef = useRef(
		new Map<string, (chart: ReactEChartsCore | null) => void>()
	);
	const hoveredRef = useRef<number | null>(null);
	const isSyncingRef = useRef(false);

	const register = useCallback((key: string) => {
		let callback = refCallbacksRef.current.get(key);

		if (!callback) {
			callback = (chart) => chartsRef.current.set(key, chart);
			refCallbacksRef.current.set(key, callback);
		}

		return callback;
	}, []);

	/** Runs actions on every other chart without echoing their events back */
	const dispatchToOthers = useCallback(
		(key: string, actions: (Record<string, unknown> & { type: string })[]) => {
			if (isSyncingRef.current) return;

			isSyncingRef.current = true;

			try {
				chartsRef.current.forEach((chart, other) => {
					const instance = chart?.getEchartsInstance();

					if (other === key || !instance || instance.isDisposed()) return;

					actions.forEach((action) => instance.dispatchAction(action));
				});
			} finally {
				isSyncingRef.current = false;
			}
		},
		[]
	);

	const syncZoomFrom = useCallback(
		(key: string) => {
			const source = chartsRef.current.get(key)?.getEchartsInstance();
			const option = source?.getOption() as
				| { dataZoom?: DataZoomOption[] }
				| undefined;
			const zoom = option?.dataZoom?.[0];

			if (!zoom) return;

			dispatchToOthers(key, [
				{ type: 'dataZoom', start: zoom.start, end: zoom.end }
			]);
		},
		[dispatchToOthers]
	);

	const syncPointerFrom = useCallback(
		(key: string, { axesInfo = [] }: AxisPointerEvent) => {
			const index = axesInfo.find((info) => info.axisDim === 'x')?.value;
			const hovered = typeof index === 'number' ? index : null;

			if (isSyncingRef.current || hovered === hoveredRef.current) return;

			hoveredRef.current = hovered;

			dispatchToOthers(
				key,
				hovered === null
					? // hideTip leaves the axis pointer and the highlighted bars behind
					  [
							{ type: 'hideTip' },
							{ type: 'updateAxisPointer', currTrigger: 'leave' },
							{ type: 'downplay' }
					  ]
					: [{ type: 'showTip', seriesIndex: 0, dataIndex: hovered }]
			);
		},
		[dispatchToOthers]
	);

	return { register, syncZoomFrom, syncPointerFrom };
};
