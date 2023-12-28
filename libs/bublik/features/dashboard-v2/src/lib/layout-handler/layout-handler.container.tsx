/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { addDays } from 'date-fns';

import { DASHBOARD_MODE } from '@/shared/types';
import { useGetDashboardByDateQuery } from '@/services/bublik-api';
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
	const dateSearch = useDashboardDate(DASHBOARD_TABLE_ID.Main);
	const todayQuery = useGetDashboardByDateQuery();

	if (todayQuery.isLoading || modeSettings.isModeLoading) {
		return <LayoutHandlerLoading />;
	}

	if (modeSettings.mode === DASHBOARD_MODE.Columns) {
		const initialMainDate = todayQuery.data?.date
			? new Date(todayQuery.data?.date)
			: new Date();
		const initialSecondaryDate = addDays(
			todayQuery.data?.date ? new Date(todayQuery.data.date) : new Date(),
			-1
		);

		return (
			<div className="flex flex-grow gap-1 overflow-hidden h-full">
				<div
					className={cn('overflow-auto w-full relative styled-scrollbar pr-1')}
				>
					<DashboardTableContainer
						id={DASHBOARD_TABLE_ID.Secondary}
						mode={modeSettings.mode}
						initialDate={initialSecondaryDate}
					/>
				</div>
				<div
					className={cn('overflow-auto w-full relative styled-scrollbar pr-1')}
				>
					<DashboardTableContainer
						id={DASHBOARD_TABLE_ID.Main}
						mode={modeSettings.mode}
						initialDate={initialMainDate}
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
