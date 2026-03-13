/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useEffect, useRef } from 'react';

import {
	createBublikError,
	useGetDashboardByDateQuery
} from '@/services/bublik-api';
import { DASHBOARD_MODE, DashboardMode } from '@/shared/types';
import { formatTimeToAPI, parseTimeApi } from '@/shared/utils';

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

const parseDashboardDate = (value?: string) => {
	if (!value) return null;

	const parsedDate = parseTimeApi(value);

	return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const createInvalidDateError = () =>
	createBublikError({
		status: 500,
		title: 'Dashboard date is invalid',
		description:
			'Dashboard response returned an invalid date. Reload the page or select another date.'
	});

const createMissingDataError = () =>
	createBublikError({
		status: 500,
		title: 'Dashboard data is unavailable',
		description: 'Dashboard request completed without returning usable data.'
	});

const resolveTableError = ({
	error,
	hasCurrentData,
	resolvedQueryDate,
	hasDisplayData,
	isLoading,
	isFetching
}: {
	error: unknown;
	hasCurrentData: boolean;
	resolvedQueryDate: Date | null;
	hasDisplayData: boolean;
	isLoading: boolean;
	isFetching: boolean;
}) => {
	if (error) return error;
	if (hasCurrentData && !resolvedQueryDate) return createInvalidDateError();
	if (!hasDisplayData && !isLoading && !isFetching)
		return createMissingDataError();
};

export const DashboardTableContainer = ({
	id = DASHBOARD_TABLE_ID.Main,
	mode,
	initialDate,
	projectIds,
	isPending = false
}: DashboardTableContainerProps) => {
	const { date, setDate } = useDashboardDate(id);
	const { isEnabled } = useDashboardReload();
	const { term } = useDashboardSearchTerm();
	const requestedDate = date || initialDate;
	const query = useGetDashboardByDateQuery(
		requestedDate
			? {
					date: formatTimeToAPI(requestedDate),
					projects: projectIds
			  }
			: { projects: projectIds },
		{
			pollingInterval: isEnabled ? 30000 : undefined,
			refetchOnMountOrArgChange: true,
			refetchOnFocus: true
		}
	);

	usePrefetchNextAndPreviousDay(date, projectIds);

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
	const resolvedQueryDate = parseDashboardDate(query.currentData?.date);
	const tableError = resolveTableError({
		error: query.error,
		hasCurrentData: Boolean(query.currentData),
		resolvedQueryDate,
		hasDisplayData: Boolean(displayData),
		isLoading: query.isLoading,
		isFetching: query.isFetching
	});

	const finalDate = date
		? date
		: resolvedQueryDate || initialDate || new Date();

	return (
		<DashboardTable
			date={finalDate}
			headers={displayData?.header}
			rows={displayData?.rows}
			layout={layout}
			onDateChange={setDate}
			renderSubrow={renderSubrow}
			isFetching={query.isFetching || isPending}
			isLoading={!tableError && query.isLoading && !displayData}
			globalFilter={term || undefined}
			context={displayData?.payload || {}}
			error={tableError}
		/>
	);
};
