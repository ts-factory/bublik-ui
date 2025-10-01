/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useEffect } from 'react';
import {
	BooleanParam,
	DateParam,
	StringParam,
	useQueryParam,
	withDefault
} from 'use-query-params';
import { addDays } from 'date-fns';

import {
	bublikAPI,
	useGetDashboardByDateQuery,
	useGetDashboardModeQuery,
	useGetDeployInfoQuery,
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

export const useDashboardModePicker = () => {
	const { isModeLoading, mode, setMode } = useDashboardMode();
	const { date: mainDate, setDate: setMainDate } = useDashboardDate(
		DASHBOARD_TABLE_ID.Main
	);
	const { setDate: setSecondDate } = useDashboardDate(
		DASHBOARD_TABLE_ID.Secondary
	);
	const { projectIds } = useProjectSearch();
	const { data: todayData } = useGetDashboardByDateQuery({
		projects: projectIds
	});

	const handleModeChange = (nextMode: DASHBOARD_MODE) => {
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

export const useDashboardTitle = () => {
	const { projectIds } = useProjectSearch();
	const { data } = bublikAPI.useGetAllProjectsQuery();

	useEffect(() => {
		if (!data || data.length === 0) {
			document.title = 'Dashboard - Bublik';
			return;
		}

		const projectMapById = new Map(data.map((d) => [d.id, d.name]));

		const selectedProjectNames = projectIds
			.map((id) => projectMapById.get(id))
			.filter(Boolean)
			.join(' | ');

		if (selectedProjectNames) {
			document.title = `${selectedProjectNames} - Dashboard - Bublik`;
		} else if (projectIds.length > 0) {
			console.warn(
				"could not map project id to data retrieved from backend, it' either stale or incorrect"
			);
			document.title = 'Dashboard - Bublik';
		} else {
			document.title = 'All - Dashboard - Bublik';
		}
	}, [data, projectIds]);
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
