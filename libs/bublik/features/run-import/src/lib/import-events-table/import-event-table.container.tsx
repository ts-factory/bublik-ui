/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { PropsWithChildren } from 'react';
import { JsonParam, useQueryParam, withDefault } from 'use-query-params';
import { ExpandedState, PaginationState } from '@tanstack/react-table';

import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import { ImportTaskFilters } from '@/shared/types';
import { useGetImportEventLogQuery } from '@/services/bublik-api';

import {
	ImportEventTable,
	ImportEventTableEmpty,
	ImportEventTableError,
	ImportEventTableLoading
} from './import-event-table.component';
import { ImportRunFilterForm } from '../import-run-filter-form';

const FilterParams = withDefault(JsonParam, {
	job: undefined,
	run: undefined,
	url: undefined,
	celery_task: undefined,
	status: undefined
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

function useImportLogExpanded() {
	const [expanded, setExpanded] = useQueryParam<ExpandedState>(
		'expanded',
		JsonParam
	);

	return { expanded, setExpanded };
}

const useEventFilters = () => {
	const [params, setParams] = useQueryParam<ImportTaskFilters>(
		'filters',
		FilterParams
	);

	const handleFilterChange = (values: ImportTaskFilters) => {
		trackEvent(analyticsEventNames.importEventsFilterApply, {
			hasUrl: Boolean(values.url),
			hasCeleryTask: Boolean(values.celery_task),
			hasJob: Boolean(values.job),
			hasRun: Boolean(values.run),
			hasStatus: Boolean(values.status)
		});

		setParams(values, 'replaceIn');
	};

	const handleResetClick = () => {
		trackEvent(analyticsEventNames.importEventsFilterReset, {
			source: 'import_page'
		});

		setParams(
			{
				job: undefined,
				run: undefined,
				url: undefined,
				celery_task: undefined,
				status: undefined
			},
			'replace'
		);
	};

	return {
		query: params,
		setQuery: handleFilterChange,
		onResetClick: handleResetClick
	};
};

export const ImportEventsTableContainer = (props: PropsWithChildren) => {
	const { query, setQuery, onResetClick } = useEventFilters();
	const { pagination, setPagination } = useImportLogPagination();
	const { expanded, setExpanded } = useImportLogExpanded();
	const { data, isLoading, error } = useGetImportEventLogQuery(
		{
			...query,
			page: pagination.pageIndex + 1,
			page_size: pagination.pageSize
		},
		{
			pollingInterval: pagination.pageIndex === 0 ? 5000 : 0,
			refetchOnFocus: true,
			refetchOnMountOrArgChange: true
		}
	);
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
			<div className="relative flex min-h-0 flex-grow flex-col overflow-hidden">
				{isLoading ? (
					<ImportEventTableLoading />
				) : error ? (
					<ImportEventTableError error={error} />
				) : data && data.results.length ? (
					<ImportEventTable
						data={data.results}
						pagination={pagination}
						setPagination={setPagination}
						expanded={expanded}
						setExpanded={setExpanded}
						rowCount={data.pagination.count}
					/>
				) : (
					<ImportEventTableEmpty />
				)}
			</div>
		</>
	);
};
