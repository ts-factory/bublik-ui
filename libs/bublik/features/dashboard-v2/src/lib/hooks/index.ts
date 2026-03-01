/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useEffect, useMemo } from 'react';
import {
	BooleanParam,
	DateParam,
	StringParam,
	useQueryParam,
	withDefault
} from 'use-query-params';
import { addDays } from 'date-fns';

import {
	useGetDashboardByDateQuery,
	useGetDashboardModeQuery,
	useGetRunsTablePageQuery,
	usePrefetch
} from '@/services/bublik-api';
import { useProjectSearch } from '@/bublik/features/projects';
import { DASHBOARD_MODE } from '@/shared/types';
import { formatTimeToAPI } from '@/shared/utils';

export const useDashboardTvMode = () => {
	const [isTvModeEnabled, setIsTvModeEnabled] = useQueryParam(
		'tv',
		withDefault(BooleanParam, false)
	);

	return { isTvModeEnabled, setIsTvModeEnabled } as const;
};

export const DASHBOARD_TABLE_ID = {
	Main: 'main',
	Secondary: 'secondary'
} as const;

export type DashboardTableId =
	(typeof DASHBOARD_TABLE_ID)[keyof typeof DASHBOARD_TABLE_ID];

export const useDashboardDate = (table_id: DashboardTableId) => {
	const [date, setDate] = useQueryParam(`${table_id}`, DateParam);

	const reset = () => setDate(null);

	return { date, setDate, reset } as const;
};

export const useDashboardModeSearch = () => {
	const [mode, setMode] = useQueryParam('mode', StringParam);

	return { mode, setMode } as const;
};

export const useDashboardSearchTerm = () => {
	const [term, setTerm] = useQueryParam('search', StringParam);

	return { term, setTerm } as const;
};

export const useDashboardReload = () => {
	const [isEnabled, setIsEnabled] = useQueryParam(
		'reload',
		withDefault(BooleanParam, false)
	);

	return { isEnabled, setIsEnabled } as const;
};

export type DashboardLayout = 'main-left' | 'secondary-left';

export const useDashboardLayout = () => {
	const [layout, setLayout] = useQueryParam('layout', StringParam);

	const reset = () => setLayout(null);

	return {
		layout: layout as DashboardLayout | null | undefined,
		setLayout: (value: DashboardLayout | null) => setLayout(value),
		reset
	} as const;
};

export const useRunDates = () => {
	const { projectIds } = useProjectSearch();

	const { data, isLoading } = useGetRunsTablePageQuery({
		page: '1',
		pageSize: '50',
		projects: projectIds
	});

	const dates = useMemo(() => {
		if (!data?.results) return [];

		const uniqueDates = new Map<string, Date>();

		for (const run of data.results) {
			// Prefer finish date (runs can span multiple days), fallback to start
			const timestamp = run.finish || run.start;
			if (!timestamp) continue;

			const date = new Date(timestamp);
			date.setHours(0, 0, 0, 0);
			const dateKey = date.toISOString();

			if (!uniqueDates.has(dateKey)) uniqueDates.set(dateKey, date);
		}

		return Array.from(uniqueDates.values()).sort(
			(a, b) => b.getTime() - a.getTime()
		);
	}, [data?.results]);

	return { dates, isLoading };
};

export const useDashboardModePicker = () => {
	const { isModeLoading, mode, setMode } = useDashboardMode();
	const { setDate: setMainDate } = useDashboardDate(DASHBOARD_TABLE_ID.Main);
	const { setDate: setSecondDate } = useDashboardDate(
		DASHBOARD_TABLE_ID.Secondary
	);
	const { projectIds } = useProjectSearch();
	const { data: todayData } = useGetDashboardByDateQuery({
		projects: projectIds
	});
	const { dates } = useRunDates();
	const { reset: resetLayout } = useDashboardLayout();

	const handleModeChange = (nextMode: DASHBOARD_MODE) => {
		const modeToDates = {
			[DASHBOARD_MODE.Rows]: () => {
				setSecondDate(null);
				resetLayout();
			},
			[DASHBOARD_MODE.RowsLine]: () => {
				setSecondDate(null);
				resetLayout();
			},
			[DASHBOARD_MODE.Columns]: () => {
				resetLayout();

				// dates[0] = most recent date with runs
				// dates[1] = second most recent date with runs (or fallback to dates[0] - 1)
				const mainDate =
					dates[0] || (todayData ? new Date(todayData.date) : new Date());
				const secondaryDate = dates[1] || addDays(mainDate, -1);

				setMainDate(mainDate);
				setSecondDate(secondaryDate);
			}
		};

		if (!nextMode) return;

		modeToDates[nextMode]();
		setMode(nextMode);
	};

	return {
		handleModeChange,
		mode: mode,
		isModeLoading
	};
};

export const useDashboardClock = () => {
	const { date: mainDate } = useDashboardDate(DASHBOARD_TABLE_ID.Main);
	const { date: secondDate } = useDashboardDate(DASHBOARD_TABLE_ID.Secondary);
	const { projectIds } = useProjectSearch();

	const {
		fulfilledTimeStamp: todayTimetamp = new Date().getTime(),
		refetch: refetchToday
	} = useGetDashboardByDateQuery({ projects: projectIds });
	const {
		fulfilledTimeStamp: mainTimestamp = new Date().getTime(),
		refetch: refetchMain
	} = useGetDashboardByDateQuery(
		mainDate
			? { date: formatTimeToAPI(mainDate), projects: projectIds }
			: undefined
	);
	const {
		fulfilledTimeStamp: secondTimestamp = new Date().getTime(),
		refetch: refetchSecond
	} = useGetDashboardByDateQuery(
		secondDate
			? { date: formatTimeToAPI(secondDate), projects: projectIds }
			: undefined
	);

	const refetch = () => {
		if (!mainDate && !secondDate) return refetchToday();
		if (mainDate) refetchMain();
		if (secondDate) refetchSecond();
	};

	return {
		latestTimestamp: new Date(
			Math.max(todayTimetamp, mainTimestamp, secondTimestamp)
		),
		refetch
	};
};

export const useDashboardMode = () => {
	const { mode, setMode } = useDashboardModeSearch();
	const { data, isLoading: isModeLoading } = useGetDashboardModeQuery();

	return {
		setMode,
		mode: (mode || data || DASHBOARD_MODE.RowsLine) as DASHBOARD_MODE,
		isModeLoading: isModeLoading
	};
};

export const usePrefetchNextAndPreviousDay = (current?: Date | null) => {
	const prefetchForDate = usePrefetch('getDashboardByDate');

	useEffect(() => {
		if (!current) return;

		prefetchForDate({ date: formatTimeToAPI(addDays(current, 1)) });
		prefetchForDate({ date: formatTimeToAPI(addDays(current, 2)) });
		prefetchForDate({ date: formatTimeToAPI(addDays(current, -1)) });
		prefetchForDate({ date: formatTimeToAPI(addDays(current, -2)) });
	}, [current, prefetchForDate]);
};
