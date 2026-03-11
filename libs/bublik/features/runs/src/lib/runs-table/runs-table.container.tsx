/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useCallback } from 'react';
import { OnChangeFn } from '@tanstack/react-table';
import { useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';

import {
	BUBLIK_TAG,
	bublikAPI,
	useGetRunsTablePageQuery
} from '@/services/bublik-api';
import { useUserPreferences } from '@/bublik/features/user-preferences';

import {
	useRunsGlobalFilter,
	useRunsPagination,
	useRunsQuery,
	useRunsSelection
} from '../hooks';
import {
	RunsTable,
	RunsTableLoading,
	RunsTableError,
	RunsTableEmpty
} from './runs-table.component';
import { applyRunDataToSearchParams } from '../runs-form/runs-form.utils';

export const RunsTableContainer = () => {
	const dispatch = useDispatch();
	const [searchParams, setSearchParams] = useSearchParams();
	const { userPreferences } = useUserPreferences();
	const { pagination, handlePaginationChange } = useRunsPagination();
	const { localGlobalFilter, handleGlobalFilterChange } = useRunsGlobalFilter();
	const { rowSelection, addSelection, removeSelection, compareIds } =
		useRunsSelection();
	const autoApplyBadgeFilters = userPreferences.runs.autoApplyBadgeFilters;
	const handleTableGlobalFilterChange: OnChangeFn<string[]> = useCallback(
		(updater) => {
			const nextGlobalFilter =
				typeof updater === 'function' ? updater(localGlobalFilter) : updater;

			handleGlobalFilterChange(nextGlobalFilter);

			if (!autoApplyBadgeFilters) return;

			setSearchParams(
				applyRunDataToSearchParams(searchParams, nextGlobalFilter),
				{
					replace: true
				}
			);
			dispatch(bublikAPI.util.invalidateTags([BUBLIK_TAG.SessionList]));
		},
		[
			autoApplyBadgeFilters,
			dispatch,
			handleGlobalFilterChange,
			localGlobalFilter,
			searchParams,
			setSearchParams
		]
	);

	const { query } = useRunsQuery();
	const { data, isFetching, isLoading, error } = useGetRunsTablePageQuery(
		query,
		{ refetchOnFocus: true, refetchOnMountOrArgChange: true }
	);

	if (error) return <RunsTableError error={error} />;

	if (isLoading) return <RunsTableLoading count={pagination.pageSize} />;

	if (data && !data.results.length && isFetching) {
		return <RunsTableLoading count={pagination.pageSize} />;
	}

	if (!data || !data.results.length) return <RunsTableEmpty />;

	return (
		<div className={isFetching ? 'pointer-events-none opacity-40' : ''}>
			<RunsTable
				data={data.results}
				pagination={pagination}
				onPaginationChange={handlePaginationChange}
				pageCount={data.pagination.count}
				globalFilter={localGlobalFilter}
				onGlobalFilterChange={handleTableGlobalFilterChange}
				rowSelection={rowSelection}
				addSelection={addSelection}
				removeSelection={removeSelection}
				selection={compareIds}
			/>
		</div>
	);
};
