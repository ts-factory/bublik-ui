/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useGetDashboardByDateQuery } from '@/services/bublik-api';
import { DASHBOARD_MODE, DashboardMode } from '@/shared/types';
import { formatTimeToAPI } from '@/shared/utils';

import {
	DashboardTable,
	DashboardTableLoading
} from './dashboard-table.component';
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
}

export const DashboardTableContainer = ({
	id = DASHBOARD_TABLE_ID.Main,
	mode,
	initialDate = new Date()
}: DashboardTableContainerProps) => {
	const { date, setDate } = useDashboardDate(id);
	const { isEnabled } = useDashboardReload();
	const { term } = useDashboardSearchTerm();
	const query = useGetDashboardByDateQuery(
		{ date: date ? formatTimeToAPI(date) : formatTimeToAPI(initialDate) },
		{
			pollingInterval: isEnabled ? 30000 : undefined,
			refetchOnMountOrArgChange: true,
			refetchOnFocus: true
		} // 30s
	);

	usePrefetchNextAndPreviousDay(date);

	const layout = modeToLayout.get(mode);

	if (query.isLoading) return <DashboardTableLoading rowNumber={24} />;

	const finalDate =
		date || (query.data ? new Date(query.data.date) : new Date());

	return (
		<DashboardTable
			date={finalDate}
			headers={query.data?.header}
			rows={query.data?.rows}
			layout={layout}
			onDateChange={setDate}
			renderSubrow={renderSubrow}
			isFetching={query.isFetching}
			globalFilter={term || undefined}
			context={query.data?.payload || {}}
			error={query.error}
		/>
	);
};
