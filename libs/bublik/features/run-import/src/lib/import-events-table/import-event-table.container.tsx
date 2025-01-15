/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { PropsWithChildren } from 'react';
import { JsonParam, useQueryParam, withDefault } from 'use-query-params';
import { PaginationState } from '@tanstack/react-table';

import { LogQuery } from '@/shared/types';
import { useGetImportEventLogQuery } from '@/services/bublik-api';

import {
	ImportEventTable,
	ImportEventTableEmpty,
	ImportEventTableError,
	ImportEventTableLoading
} from './import-event-table.component';
import { ImportRunFilterForm } from '../import-run-filter-form';

const FilterParams = withDefault(JsonParam, {
	date: undefined,
	facility: undefined,
	msg: undefined,
	severity: undefined,
	task_id: undefined,
	url: undefined
});

const PaginationParam = withDefault(JsonParam, {
	pageIndex: 0,
	pageSize: 25
});

function useImportLogPagination() {
	const [pagination, setPagination] = useQueryParam<PaginationState>(
		'pagination',
		PaginationParam
	);

	return { pagination, setPagination };
}

const useEventFilters = () => {
	const [params, setParams] = useQueryParam<LogQuery>('filters', FilterParams);

	const handleFilterChange = (values: LogQuery) => {
		setParams(values, 'replaceIn');
	};

	const handleResetClick = () => {
		setParams(
			{
				date: undefined,
				facility: undefined,
				msg: undefined,
				severity: undefined,
				task_id: undefined,
				url: undefined
			},
			'replaceIn'
		);
	};

	return {
		query: {
			...params,
			date: params?.date ? new Date(params.date) : undefined
		},
		setQuery: handleFilterChange,
		onResetClick: handleResetClick
	};
};

export const ImportEventsTableContainer = (props: PropsWithChildren) => {
	const { query, setQuery, onResetClick } = useEventFilters();
	const { pagination, setPagination } = useImportLogPagination();
	const { data, isLoading, error } = useGetImportEventLogQuery(query, {
		pollingInterval: pagination.pageIndex === 0 ? 5000 : 0,
		refetchOnFocus: true,
		refetchOnMountOrArgChange: true
	});

	return (
		<>
			<div className="px-6 py-4 bg-white rounded-t-xl">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<ImportRunFilterForm
						key={JSON.stringify(query)}
						onFiltersChange={setQuery}
						defaultValues={query}
						onResetClick={onResetClick}
					/>
					{props.children}
				</div>
			</div>
			<div className="flex flex-col overflow-auto flex-grow">
				{isLoading ? (
					<ImportEventTableLoading />
				) : error ? (
					<ImportEventTableError error={error} />
				) : data && data.length ? (
					<ImportEventTable
						data={data}
						pagination={pagination}
						setPagination={setPagination}
					/>
				) : (
					<ImportEventTableEmpty />
				)}
			</div>
		</>
	);
};
