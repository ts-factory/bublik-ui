/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useEffect } from 'react';
import { addDays } from 'date-fns';

import { DASHBOARD_MODE } from '@/shared/types';
import { useGetDashboardByDateQuery } from '@/services/bublik-api';
import { useProjectSearch } from '@/bublik/features/projects';
import { cn } from '@/shared/tailwind-ui';

import {
	DASHBOARD_TABLE_ID,
	useDashboardDate,
	useDashboardLayout,
	useDashboardMode,
	useRunDates
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
	const dateSearch = useDashboardDate(DASHBOARD_TABLE_ID.Main);
	const secondaryDateSearch = useDashboardDate(DASHBOARD_TABLE_ID.Secondary);
	const { projectIds } = useProjectSearch();
	const todayQuery = useGetDashboardByDateQuery({ projects: projectIds });
	const { layout, setLayout } = useDashboardLayout();
	const { dates } = useRunDates();

	// Calculate and store layout if not set (only in Columns mode)
	useEffect(() => {
		if (modeSettings.mode !== DASHBOARD_MODE.Columns) return;
		if (layout) return; // Layout already set, don't recalculate

		const initialMainDate = todayQuery.data?.date
			? new Date(todayQuery.data.date)
			: new Date();

		// Use dates from runs if available, otherwise fallback to previous day
		const initialSecondaryDate = dates[1] || addDays(initialMainDate, -1);

		const effectiveMainDate = dateSearch.date || initialMainDate;
		const effectiveSecondaryDate =
			secondaryDateSearch.date || initialSecondaryDate;

		// Check if dates need to be swapped to maintain chronological order (older on left)
		const shouldSwap =
			effectiveSecondaryDate &&
			effectiveMainDate &&
			effectiveSecondaryDate.getTime() > effectiveMainDate.getTime();

		// Store the layout decision in URL
		setLayout(shouldSwap ? 'main-left' : 'secondary-left');
	}, [
		modeSettings.mode,
		layout,
		todayQuery.data?.date,
		dates,
		dateSearch.date,
		secondaryDateSearch.date,
		setLayout
	]);

	if (todayQuery.isLoading || modeSettings.isModeLoading) {
		return <LayoutHandlerLoading />;
	}

	if (modeSettings.mode === DASHBOARD_MODE.Columns) {
		const initialMainDate = todayQuery.data?.date
			? new Date(todayQuery.data?.date)
			: new Date();

		// Use dates from runs if available, otherwise fallback to previous day
		const initialSecondaryDate = dates[1] || addDays(initialMainDate, -1);

		// Use stored layout for table positions (default to secondary-left if not set)
		const useMainLeft = layout === 'main-left';

		const leftTable = useMainLeft
			? { id: DASHBOARD_TABLE_ID.Main, initialDate: initialMainDate }
			: { id: DASHBOARD_TABLE_ID.Secondary, initialDate: initialSecondaryDate };
		const rightTable = useMainLeft
			? { id: DASHBOARD_TABLE_ID.Secondary, initialDate: initialSecondaryDate }
			: { id: DASHBOARD_TABLE_ID.Main, initialDate: initialMainDate };

		return (
			<div className="flex flex-grow gap-1 overflow-hidden h-full">
				<div
					className={cn('overflow-auto w-full relative styled-scrollbar pr-1')}
				>
					<DashboardTableContainer
						id={leftTable.id}
						mode={modeSettings.mode}
						initialDate={leftTable.initialDate}
					/>
				</div>
				<div
					className={cn('overflow-auto w-full relative styled-scrollbar pr-1')}
				>
					<DashboardTableContainer
						id={rightTable.id}
						mode={modeSettings.mode}
						initialDate={rightTable.initialDate}
					/>
				</div>
			</div>
		);
	}

	return (
		<DashboardTableContainer
			id={DASHBOARD_TABLE_ID.Main}
			mode={modeSettings.mode}
			initialDate={
				dateSearch.date ||
				(todayQuery.data?.date ? new Date(todayQuery.data?.date) : new Date())
			}
		/>
	);
};
