/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useGetRunsTablePageQuery } from '@/services/bublik-api';

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

export const RunsTableContainer = () => {
	const { pagination, handlePaginationChange } = useRunsPagination();
	const { localGlobalFilter, handleGlobalFilterChange } = useRunsGlobalFilter();
	const { rowSelection, addSelection, removeSelection, compareIds } =
		useRunsSelection();

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
				onGlobalFilterChange={handleGlobalFilterChange}
				rowSelection={rowSelection}
				addSelection={addSelection}
				removeSelection={removeSelection}
				selection={compareIds}
			/>
		</div>
	);
};
