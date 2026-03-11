/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useEffect, useRef } from 'react';

import { useGetDashboardByDateQuery } from '@/services/bublik-api';
import { DASHBOARD_MODE, DashboardMode } from '@/shared/types';
import { formatTimeToAPI } from '@/shared/utils';

import { DashboardTable } from './dashboard-table.component';
import {
	DASHBOARD_TABLE_ID,
	DashboardTableId,
	useDashboardDate,
	useDashboardReload,
	useDashboardSearchTerm,
	usePrefetchNextAndPreviousDay
} from '../hooks';
import { renderSubrow } from '../subrow';

const modeToLayout = new Map<DASHBOARD_MODE | DashboardMode, 'row' | 'column'>([
	[DASHBOARD_MODE.Rows, 'row'],
	[DASHBOARD_MODE.RowsLine, 'column'],
	[DASHBOARD_MODE.Columns, 'row']
]);

interface DashboardTableContainerProps {
	id?: DashboardTableId;
	mode: DASHBOARD_MODE | DashboardMode;
	initialDate?: Date;
	projectIds: number[];
	isPending?: boolean;
}

export const DashboardTableContainer = ({
	id = DASHBOARD_TABLE_ID.Main,
	mode,
	initialDate = new Date(),
	projectIds,
	isPending = false
}: DashboardTableContainerProps) => {
	const { date, setDate } = useDashboardDate(id);
	const { isEnabled } = useDashboardReload();
	const { term } = useDashboardSearchTerm();
	const requestedDate = date || initialDate;
	const query = useGetDashboardByDateQuery(
		{
			date: formatTimeToAPI(requestedDate),
			projects: projectIds
		},
		{
			pollingInterval: isEnabled ? 30000 : undefined,
			refetchOnMountOrArgChange: true,
			refetchOnFocus: true
		} // 30s
	);

	usePrefetchNextAndPreviousDay(date);

	const layout = modeToLayout.get(mode);
	const lastResolvedDataRef = useRef(query.currentData);

	useEffect(() => {
		if (!query.currentData) return;

		lastResolvedDataRef.current = query.currentData;
	}, [query.currentData]);

	const displayData =
		query.currentData ||
		(query.isFetching || query.isLoading
			? lastResolvedDataRef.current
			: undefined);

	const finalDate = date
		? date
		: query.currentData
		? new Date(query.currentData.date)
		: initialDate;

	return (
		<DashboardTable
			date={finalDate}
			headers={displayData?.header}
			rows={displayData?.rows}
			layout={layout}
			onDateChange={setDate}
			renderSubrow={renderSubrow}
			isFetching={query.isFetching || isPending}
			isLoading={query.isLoading && !displayData}
			globalFilter={term || undefined}
			context={displayData?.payload || {}}
			error={query.error}
		/>
	);
};
