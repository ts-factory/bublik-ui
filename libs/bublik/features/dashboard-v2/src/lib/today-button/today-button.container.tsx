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
	useDashboardModeSearch
} from '../hooks';

export const TodayButtonContainer = () => {
	const { mode } = useDashboardModeSearch();
	const { projectIds } = useProjectSearch();
	const { data } = useGetDashboardByDateQuery({ projects: projectIds });
	const { setDate: setFirstDate } = useDashboardDate(DASHBOARD_TABLE_ID.Main);
	const { setDate: setSecondDate } = useDashboardDate(
		DASHBOARD_TABLE_ID.Secondary
	);

	const handleTodayButtonClick = () => {
		if (mode === DASHBOARD_MODE.Columns) {
			if (!data) return;

			setFirstDate(new Date(data.date));
			setSecondDate(addDays(new Date(data.date), -1));
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
