/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useEffect, useMemo } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';

import { bublikAPI, type Project } from '@/services/bublik-api';
import { useLocalStorage } from '@/shared/hooks';
import type { RunsAPIQuery } from '@/shared/types';

import {
	DEFAULT_PROJECT_ORDER_PREFERENCE,
	PROJECT_ORDER_STORAGE_KEY,
	parseProjectOrderPreference,
	sortProjects,
	type ProjectSort
} from './project-order.utils';

/* One run is enough: the list is ordered by start, newest first, and its
   pagination counts every run the project has. */
function getProjectLastRunQuery(projectId?: number): RunsAPIQuery {
	return {
		projects: projectId === undefined ? undefined : [projectId],
		pageSize: '1'
	};
}

type LastRunState = Parameters<
	ReturnType<typeof bublikAPI.endpoints.getRunsTablePage.select>
>[0];

const NO_LAST_RUN_TIMES: (number | undefined)[] = [];

/**
 * When each project last ran, read from the queries its switcher row makes.
 * While `enabled` they are held here too, so they are answered before the
 * switcher opens and the list does not reshuffle while its rows load.
 */
function useProjectLastRunTimes(
	projects: readonly Project[],
	enabled: boolean
): ReadonlyMap<number, number> {
	const dispatch =
		useDispatch<ThunkDispatch<LastRunState, unknown, UnknownAction>>();

	useEffect(() => {
		if (!enabled) return;

		const subscriptions = projects.map((project) =>
			dispatch(
				bublikAPI.endpoints.getRunsTablePage.initiate(
					getProjectLastRunQuery(project.id)
				)
			)
		);

		return () =>
			subscriptions.forEach((subscription) => subscription.unsubscribe());
	}, [dispatch, enabled, projects]);

	const selectors = useMemo(
		() =>
			projects.map((project) =>
				bublikAPI.endpoints.getRunsTablePage.select(
					getProjectLastRunQuery(project.id)
				)
			),
		[projects]
	);

	const times = useSelector((state: LastRunState) => {
		if (!enabled) return NO_LAST_RUN_TIMES;

		return selectors.map((select) => {
			const start = select(state).data?.results.at(0)?.start;

			return start ? new Date(start).getTime() : undefined;
		});
	}, shallowEqual);

	return useMemo(() => {
		const lastRunTimes = new Map<number, number>();

		times.forEach((time, index) => {
			const project = projects[index];

			if (project && time !== undefined && !Number.isNaN(time)) {
				lastRunTimes.set(project.id, time);
			}
		});

		return lastRunTimes;
	}, [projects, times]);
}

interface UseProjectOrderResult {
	/** The projects in the order the switcher lists them. */
	projects: Project[];
	sort: ProjectSort;
	setSort: (sort: ProjectSort) => void;
	/** Saves the ids as the Custom Order, and lists the projects by it. */
	setOrder: (projectIds: number[]) => void;
}

const NO_PROJECTS: readonly Project[] = [];

/** The switcher's order: kept in this browser, not in the URL or the server. */
function useProjectOrder(
	projects: readonly Project[] = NO_PROJECTS
): UseProjectOrderResult {
	const [stored, setStored] = useLocalStorage<unknown>(
		PROJECT_ORDER_STORAGE_KEY,
		DEFAULT_PROJECT_ORDER_PREFERENCE
	);
	const { sort, order } = useMemo(
		() => parseProjectOrderPreference(stored),
		[stored]
	);
	const lastRunTimes = useProjectLastRunTimes(projects, sort === 'last-run');

	const sorted = useMemo(
		() => sortProjects(projects, { sort, order, lastRunTimes }),
		[projects, sort, order, lastRunTimes]
	);

	return {
		projects: sorted,
		sort,
		setSort: (next) => setStored({ sort: next, order }),
		setOrder: (projectIds) => setStored({ sort: 'custom', order: projectIds })
	};
}

export { getProjectLastRunQuery, useProjectOrder };
