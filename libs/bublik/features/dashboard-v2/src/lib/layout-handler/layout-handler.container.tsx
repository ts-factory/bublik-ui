/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useEffect, useRef } from 'react';
import { addDays } from 'date-fns';

import { DASHBOARD_MODE } from '@/shared/types';
import {
	createBublikError,
	useGetDashboardByDateQuery
} from '@/services/bublik-api';
import { useProjectSearch } from '@/bublik/features/projects';
import { cn } from '@/shared/tailwind-ui';
import { parseTimeApi } from '@/shared/utils';

import {
	DASHBOARD_TABLE_ID,
	useDashboardDate,
	useDashboardMode
} from '../hooks';
import {
	DashboardTableContainer,
	DashboardTableError,
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

const parseDashboardDate = (value?: string) => {
	if (!value) return null;

	const parsedDate = parseTimeApi(value);

	return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const getProjectIdsKey = (projectIds: number[]) => projectIds.join(',');

const createMissingDateError = () =>
	createBublikError({
		status: 500,
		title: 'Dashboard date is unavailable',
		description:
			'Dashboard response finished without a valid date. Reload the page or pick a date manually.'
	});

const resolveImplicitDateError = ({
	needsImplicitDate,
	resolvedTodayDate,
	error,
	isLoading,
	isFetching
}: {
	needsImplicitDate: boolean;
	resolvedTodayDate: Date | null;
	error: unknown;
	isLoading: boolean;
	isFetching: boolean;
}) => {
	if (!needsImplicitDate || resolvedTodayDate) return undefined;
	if (error) return error;
	if (!isLoading && !isFetching) return createMissingDateError();

	return undefined;
};

export const LayoutHandlerContainer = () => {
	const modeSettings = useDashboardMode();
	const mainDateSearch = useDashboardDate(DASHBOARD_TABLE_ID.Main);
	const secondaryDateSearch = useDashboardDate(DASHBOARD_TABLE_ID.Secondary);
	const { projectIds } = useProjectSearch();
	const todayQuery = useGetDashboardByDateQuery({ projects: projectIds });
	const lastResolvedTodayDateRef = useRef<Date | null>(null);
	const lastResolvedTodayKeyRef = useRef<string | null>(null);
	const resolvedTodayQueryDate = todayQuery.currentData?.date;
	const currentProjectIdsKey = getProjectIdsKey(projectIds);

	useEffect(() => {
		if (!resolvedTodayQueryDate) return;

		const parsedDate = parseDashboardDate(resolvedTodayQueryDate);

		if (!parsedDate) return;

		lastResolvedTodayDateRef.current = parsedDate;
		lastResolvedTodayKeyRef.current = currentProjectIdsKey;
	}, [currentProjectIdsKey, resolvedTodayQueryDate]);

	const canReuseResolvedToday =
		lastResolvedTodayKeyRef.current === currentProjectIdsKey;

	const resolvedTodayDate = resolvedTodayQueryDate
		? parseDashboardDate(resolvedTodayQueryDate)
		: canReuseResolvedToday
		? lastResolvedTodayDateRef.current
		: null;
	const needsImplicitMainDate = !mainDateSearch.date;
	const needsImplicitSecondaryDate =
		modeSettings.mode === DASHBOARD_MODE.Columns && !secondaryDateSearch.date;
	const needsImplicitDate = needsImplicitMainDate || needsImplicitSecondaryDate;
	const isResolvingImplicitDate =
		needsImplicitDate && todayQuery.isFetching && !resolvedTodayQueryDate;
	const mainProjectIds = projectIds;
	const secondaryProjectIds = projectIds;
	const isMainPending = !mainDateSearch.date && isResolvingImplicitDate;
	const isSecondaryPending =
		!secondaryDateSearch.date && isResolvingImplicitDate;
	const implicitDateError = resolveImplicitDateError({
		needsImplicitDate,
		resolvedTodayDate,
		error: todayQuery.error,
		isLoading: todayQuery.isLoading,
		isFetching: todayQuery.isFetching
	});

	if (modeSettings.isModeLoading) {
		return <LayoutHandlerLoading />;
	}

	if (implicitDateError) {
		return <DashboardTableError error={implicitDateError} />;
	}

	if (needsImplicitDate && !resolvedTodayDate) {
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
