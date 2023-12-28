/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC, useMemo } from 'react';
import { OnChangeFn, PaginationState, TableState } from '@tanstack/react-table';

import { HistoryDataAggregation } from '@/shared/types';
import { Skeleton, TableClassNames, TwTable } from '@/shared/tailwind-ui';

import { columns } from './history-aggregation.columns';
import { globalFilterFn } from './history-aggregation.utils';
import { HistoryAggregationGlobalFilter } from './history-aggregation.types';

export const HistoryLoadingAggregation = (props: { rowCount?: number }) => {
	const { rowCount = 25 } = props;

	return (
		<div className="flex flex-col gap-1">
			<Skeleton className="h-10 rounded-b" />
			{Array.from({ length: rowCount }).map((_, idx) => (
				<Skeleton key={idx} className="h-32 rounded-md" />
			))}
		</div>
	);
};

const gridClassName = 'grid grid-cols-[0.5fr,1fr]';

const classNames: TableClassNames<HistoryDataAggregation> = {
	header: 'sticky top-0 z-10',
	headerRow: `h-10 bg-white px-4 ${gridClassName} rounded-b`,
	headerCell:
		'text-[0.6875rem] font-semibold leading-[0.875rem] justify-start flex items-center',
	body: 'space-y-1 [&>:first-of-type]:mt-1',
	bodyRow: `bg-white py-2 px-3 rounded-md ${gridClassName} border border-transparent hover:border-primary transition-colors`,
	bodyCell: 'px-1'
};

export interface HistoryAggregationProps {
	data: HistoryDataAggregation[];
	pageCount: number;
	pagination: PaginationState;
	onPaginationChange: OnChangeFn<PaginationState>;
	globalFilter: HistoryAggregationGlobalFilter;
	onGlobalFilterChange: OnChangeFn<HistoryAggregationGlobalFilter>;
}

export const HistoryAggregation: FC<HistoryAggregationProps> = ({
	data,
	pageCount,
	onPaginationChange,
	pagination,
	globalFilter,
	onGlobalFilterChange
}) => {
	const state = useMemo<Partial<TableState>>(
		() => ({ pagination, globalFilter }),
		[globalFilter, pagination]
	);
	return (
		<TwTable<HistoryDataAggregation>
			data={data}
			columns={columns}
			state={state}
			pageCount={pageCount}
			onPaginationChange={onPaginationChange}
			globalFilterFn={globalFilterFn}
			onGlobalFilterChange={onGlobalFilterChange}
			getColumnCanGlobalFilter={() => true}
			classNames={classNames}
			stickyOffset={-1}
			manualPagination
			enableSorting={false}
		/>
	);
};
