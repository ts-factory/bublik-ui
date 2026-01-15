/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { addDays } from 'date-fns';

import { ButtonTw, Tooltip } from '@/shared/tailwind-ui';
import { useGetDashboardByDateQuery } from '@/services/bublik-api';
import { useProjectSearch } from '@/bublik/features/projects';
import { DASHBOARD_MODE } from '@/shared/types';

import {
	DASHBOARD_TABLE_ID,
	useDashboardDate,
	useDashboardLayout,
	useDashboardModeSearch,
	useRunDates
} from '../hooks';

export const TodayButtonContainer = () => {
	const { mode } = useDashboardModeSearch();
	const { projectIds } = useProjectSearch();
	const { data } = useGetDashboardByDateQuery({ projects: projectIds });
	const { setDate: setFirstDate } = useDashboardDate(DASHBOARD_TABLE_ID.Main);
	const { setDate: setSecondDate } = useDashboardDate(
		DASHBOARD_TABLE_ID.Secondary
	);
	const { dates } = useRunDates();
	const { reset: resetLayout } = useDashboardLayout();

	const handleTodayButtonClick = () => {
		if (mode === DASHBOARD_MODE.Columns) {
			if (!data) return;

			// Reset layout so it gets recalculated based on new dates
			resetLayout();

			// dates[0] = most recent date with runs
			// dates[1] = second most recent date with runs (or fallback to dates[0] - 1)
			const mainDate = dates[0] || new Date(data.date);
			const secondaryDate = dates[1] || addDays(mainDate, -1);

			setFirstDate(mainDate);
			setSecondDate(secondaryDate);
			return;
		}

		setFirstDate(null);
		setSecondDate(null);
	};

	return (
		<Tooltip content="Set view to today dashboard">
			<ButtonTw variant={'outline'} onClick={handleTodayButtonClick}>
				Today
			</ButtonTw>
		</Tooltip>
	);
};
