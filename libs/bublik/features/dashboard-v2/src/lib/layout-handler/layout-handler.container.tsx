/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useEffect, useRef } from 'react';
import { addDays } from 'date-fns';

import { DASHBOARD_MODE } from '@/shared/types';
import { useGetDashboardByDateQuery } from '@/services/bublik-api';
import { useProjectSearch } from '@/bublik/features/projects';
import { cn } from '@/shared/tailwind-ui';

import {
	DASHBOARD_TABLE_ID,
	useDashboardDate,
	useDashboardMode
} from '../hooks';
import {
	DashboardTableContainer,
	DashboardTableLoading
} from '../dashboard-table';

const LayoutHandlerLoading = () => {
	return (
		<div className="flex gap-1">
			<DashboardTableLoading rowNumber={25} />
			<DashboardTableLoading rowNumber={25} />
		</div>
	);
};

export const LayoutHandlerContainer = () => {
	const modeSettings = useDashboardMode();
	const mainDateSearch = useDashboardDate(DASHBOARD_TABLE_ID.Main);
	const secondaryDateSearch = useDashboardDate(DASHBOARD_TABLE_ID.Secondary);
	const { projectIds } = useProjectSearch();
	const todayQuery = useGetDashboardByDateQuery({ projects: projectIds });
	const lastResolvedTodayDateRef = useRef<Date | null>(null);
	const lastResolvedProjectIdsRef = useRef<number[]>(projectIds);
	const resolvedTodayQueryDate = todayQuery.currentData?.date;

	useEffect(() => {
		if (!resolvedTodayQueryDate) return;

		lastResolvedTodayDateRef.current = new Date(resolvedTodayQueryDate);
		lastResolvedProjectIdsRef.current = projectIds;
	}, [projectIds, resolvedTodayQueryDate]);

	const resolvedTodayDate = resolvedTodayQueryDate
		? new Date(resolvedTodayQueryDate)
		: lastResolvedTodayDateRef.current;
	const resolvedProjectIds = resolvedTodayQueryDate
		? projectIds
		: lastResolvedProjectIdsRef.current;
	const needsImplicitMainDate = !mainDateSearch.date;
	const needsImplicitSecondaryDate =
		modeSettings.mode === DASHBOARD_MODE.Columns && !secondaryDateSearch.date;
	const needsImplicitDate = needsImplicitMainDate || needsImplicitSecondaryDate;
	const isResolvingImplicitDate =
		needsImplicitDate && todayQuery.isFetching && !resolvedTodayQueryDate;
	const mainProjectIds = mainDateSearch.date ? projectIds : resolvedProjectIds;
	const secondaryProjectIds = secondaryDateSearch.date
		? projectIds
		: resolvedProjectIds;
	const isMainPending = !mainDateSearch.date && isResolvingImplicitDate;
	const isSecondaryPending =
		!secondaryDateSearch.date && isResolvingImplicitDate;

	if (modeSettings.isModeLoading || (needsImplicitDate && !resolvedTodayDate)) {
		return <LayoutHandlerLoading />;
	}

	const effectiveTodayDate =
		resolvedTodayDate ?? mainDateSearch.date ?? secondaryDateSearch.date;

	if (!effectiveTodayDate) {
		return <LayoutHandlerLoading />;
	}

	if (modeSettings.mode === DASHBOARD_MODE.Columns) {
		const initialMainDate = effectiveTodayDate;
		const initialSecondaryDate = addDays(effectiveTodayDate, -1);

		return (
			<div className="flex flex-grow gap-1 overflow-hidden h-full">
				<div
					className={cn('overflow-auto w-full relative styled-scrollbar pr-1')}
				>
					<DashboardTableContainer
						id={DASHBOARD_TABLE_ID.Secondary}
						mode={modeSettings.mode}
						initialDate={initialSecondaryDate}
						projectIds={secondaryProjectIds}
						isPending={isSecondaryPending}
					/>
				</div>
				<div
					className={cn('overflow-auto w-full relative styled-scrollbar pr-1')}
				>
					<DashboardTableContainer
						id={DASHBOARD_TABLE_ID.Main}
						mode={modeSettings.mode}
						initialDate={initialMainDate}
						projectIds={mainProjectIds}
						isPending={isMainPending}
					/>
				</div>
			</div>
		);
	}

	return (
		<DashboardTableContainer
			id={DASHBOARD_TABLE_ID.Main}
			mode={modeSettings.mode}
			initialDate={mainDateSearch.date || effectiveTodayDate}
			projectIds={mainProjectIds}
			isPending={isMainPending}
		/>
	);
};
