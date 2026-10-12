/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { getRouteApi } from '@tanstack/react-router';
import { addDays } from 'date-fns';

import { useSearchWriter } from '@/router';
import {
	BUBLIK_TAG,
	bublikAPI,
	useGetDashboardByDateQuery,
	useGetDashboardModeQuery,
	usePrefetch
} from '@/services/bublik-api';
import { useProjectSearch } from '@/bublik/features/projects';
import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import { DASHBOARD_MODE } from '@/shared/types';
import {
	dashboardSearch,
	formatTimeToAPI,
	type DashboardSearch
} from '@/shared/utils';

/** The dashboard route (`routes/_app/dashboard.tsx`), typed by the app's route tree. */
const dashboardRoute = getRouteApi('/_app/dashboard');

type DashboardSearchValue = string | number | boolean | undefined;

/**
 * A value of the dashboard route's typed search, with the
 * schema's read-time defaults filled in. Read from the dashboard's match,
 * which keeps its own search while a navigation away is pending. Selections are primitives, so a re-render happens only when one
 * changes.
 */
function useDashboardSearch<T extends DashboardSearchValue>(
	select: (search: DashboardSearch) => T
): T {
	const value = dashboardRoute.useSearch({
		// Primitives need none, and its typing rejects `undefined`.
		structuralSharing: false,
		select: (search): DashboardSearchValue =>
			select(dashboardSearch.withDefaults(search))
	});

	return value as T;
}

/**
 * Writes dashboard keys as use-query-params' `replaceIn` did: merged into the
 * current search, replacing the entry, the hash dropped and `location.state`
 * kept. Typed values are serialized by the route's codecs, `undefined`
 * removes a key, and several writes in one handler make one entry.
 */
function useDashboardSearchWriter(): (changes: DashboardSearch) => void {
	return useSearchWriter();
}

export const useDashboardTvMode = () => {
	const isTvModeEnabled = useDashboardSearch((search) => search.tv ?? false);
	const writeSearch = useDashboardSearchWriter();

	const setIsTvModeEnabled = useCallback(
		(enabled: boolean) => writeSearch({ tv: enabled }),
		[writeSearch]
	);

	return { isTvModeEnabled, setIsTvModeEnabled } as const;
};

export const DASHBOARD_TABLE_ID = {
	Main: 'main',
	Secondary: 'secondary'
} as const;

export type DashboardTableId =
	(typeof DASHBOARD_TABLE_ID)[keyof typeof DASHBOARD_TABLE_ID];

/**
 * A pinned day. An unparsable one (kept on the URL as its raw string) reads
 * as none, as `DateParam` decoded it; the `Date` is the same object while
 * the day stays the same, so effects keyed on it do not re-run.
 */
export const useDashboardDate = (table_id: DashboardTableId) => {
	const time = useDashboardSearch((search) => {
		const value = search[table_id];

		return value instanceof Date ? value.getTime() : undefined;
	});
	const date = useMemo(
		() => (time === undefined ? undefined : new Date(time)),
		[time]
	);
	const writeSearch = useDashboardSearchWriter();

	const setDate = useCallback(
		(nextDate: Date | null | undefined) =>
			writeSearch({ [table_id]: nextDate ?? undefined }),
		[table_id, writeSearch]
	);

	const reset = () => setDate(null);

	return { date, setDate, reset } as const;
};

export const useDashboardModeSearch = () => {
	const mode = useDashboardSearch((search) => search.mode);
	const writeSearch = useDashboardSearchWriter();

	const setMode = useCallback(
		(nextMode: DASHBOARD_MODE | undefined) => writeSearch({ mode: nextMode }),
		[writeSearch]
	);

	return { mode, setMode } as const;
};

export const useDashboardSearchTerm = () => {
	const term = useDashboardSearch((search) => search.search);
	const writeSearch = useDashboardSearchWriter();

	// An empty term is written as `search=`, as before.
	const setTerm = useCallback(
		(nextTerm: string | undefined) => writeSearch({ search: nextTerm }),
		[writeSearch]
	);

	return { term, setTerm } as const;
};

export const useDashboardReload = () => {
	const isEnabled = useDashboardSearch((search) => search.reload ?? false);
	const writeSearch = useDashboardSearchWriter();

	const setIsEnabled = useCallback(
		(enabled: boolean) => writeSearch({ reload: enabled }),
		[writeSearch]
	);

	return { isEnabled, setIsEnabled } as const;
};

export const useDashboardModePicker = () => {
	const { isModeLoading, mode, setMode } = useDashboardMode();
	const { date: mainDate, setDate: setMainDate } = useDashboardDate(
		DASHBOARD_TABLE_ID.Main
	);
	const { date: secondDate, setDate: setSecondDate } = useDashboardDate(
		DASHBOARD_TABLE_ID.Secondary
	);
	const { projectIds } = useProjectSearch();
	const { data: todayData } = useGetDashboardByDateQuery({
		projects: projectIds
	});

	const handleModeChange = (nextMode: DASHBOARD_MODE) => {
		if (!nextMode || nextMode === mode) return;

		const modeToDates = {
			[DASHBOARD_MODE.Rows]: () => {
				setSecondDate(null);
			},
			[DASHBOARD_MODE.RowsLine]: () => {
				setSecondDate(null);
			},
			[DASHBOARD_MODE.Columns]: () => {
				if (mainDate) return setSecondDate(addDays(mainDate, -1));

				if (!todayData) return;

				setSecondDate(addDays(new Date(todayData.date), -1));
				setMainDate(new Date(todayData.date));
			}
		};

		modeToDates[nextMode]();
		setMode(nextMode);

		trackEvent(analyticsEventNames.dashboardModeChange, {
			fromMode: mode,
			toMode: nextMode,
			hadMainDate: Boolean(mainDate),
			hadSecondaryDate: Boolean(secondDate)
		});
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
	const dispatch = useDispatch();

	const { fulfilledTimeStamp: todayTimetamp = new Date().getTime() } =
		useGetDashboardByDateQuery({ projects: projectIds });
	const { fulfilledTimeStamp: mainTimestamp = new Date().getTime() } =
		useGetDashboardByDateQuery(
			mainDate
				? { date: formatTimeToAPI(mainDate), projects: projectIds }
				: undefined,
			{ skip: !mainDate }
		);
	const { fulfilledTimeStamp: secondTimestamp = new Date().getTime() } =
		useGetDashboardByDateQuery(
			secondDate
				? { date: formatTimeToAPI(secondDate), projects: projectIds }
				: undefined,
			{ skip: !secondDate }
		);

	const refetch = () => {
		dispatch(bublikAPI.util.invalidateTags([BUBLIK_TAG.DashboardData]));
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

export const usePrefetchNextAndPreviousDay = (
	current?: Date | null,
	projectIds?: number[]
) => {
	const prefetchForDate = usePrefetch('getDashboardByDate');

	useEffect(() => {
		if (!current) return;

		prefetchForDate({
			date: formatTimeToAPI(addDays(current, 1)),
			projects: projectIds
		});
		prefetchForDate({
			date: formatTimeToAPI(addDays(current, 2)),
			projects: projectIds
		});
		prefetchForDate({
			date: formatTimeToAPI(addDays(current, -1)),
			projects: projectIds
		});
		prefetchForDate({
			date: formatTimeToAPI(addDays(current, -2)),
			projects: projectIds
		});
	}, [current, prefetchForDate, projectIds]);
};
