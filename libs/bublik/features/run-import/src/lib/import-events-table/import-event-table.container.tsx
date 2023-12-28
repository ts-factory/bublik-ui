/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { PropsWithChildren } from 'react';
import { JsonParam, useQueryParam, withDefault } from 'use-query-params';

import { LogQuery } from '@/shared/types';
import { useGetImportEventLogQuery } from '@/services/bublik-api';
import { cn } from '@/shared/tailwind-ui';

import {
	ImportEventTable,
	ImportEventTableEmpty,
	ImportEventTableError,
	ImportEventTableLoading
} from './import-event-table.component';
import { ImportRunFilterForm } from '../import-run-filter-form';

const useEventFilters = () => {
	const [params, setParams] = useQueryParam<LogQuery>(
		'filters',
		withDefault(JsonParam, {
			date: undefined,
			facility: undefined,
			msg: undefined,
			severity: undefined,
			task_id: undefined,
			url: undefined
		})
	);

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
	const { data, isLoading, isFetching, error } =
		useGetImportEventLogQuery(query);

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
			<div
				className={cn('flex flex-col', isFetching && 'opacity-40 select-none')}
			>
				{isLoading ? (
					<ImportEventTableLoading />
				) : error ? (
					<ImportEventTableError error={error} />
				) : data && data.length ? (
					<ImportEventTable data={data} />
				) : (
					<ImportEventTableEmpty />
				)}
			</div>
		</>
	);
};
