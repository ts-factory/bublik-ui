/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC, useMemo } from 'react';
import { OnChangeFn, PaginationState, TableState } from '@tanstack/react-table';

import { HistoryDataLinear } from '@/shared/types';
import { Skeleton, TableClassNames, TwTable } from '@/shared/tailwind-ui';

import { HistoryLinearGlobalFilter } from './history-linear.types';
import { globalFilterFn } from './history-linear.utils';
import { columns } from './history-linear.columns';

export const HistoryLinearLoading = (props: { rowCount?: number }) => {
	const { rowCount = 25 } = props;

	return (
		<div className="flex flex-col gap-1">
			<Skeleton className="h-10 rounded-b" />
			{Array.from({ length: rowCount }).map((_, idx) => (
				<Skeleton key={idx} className="rounded-md h-72" />
			))}
		</div>
	);
};

const gridClassName = 'grid grid-cols-[120px,130px,0.8fr,1fr,1fr,1fr,1.4fr]';

const classNames: TableClassNames<HistoryDataLinear> = {
	header: 'sticky top-0 z-10',
	headerRow: `h-10 bg-white ${gridClassName} rounded-b`,
	headerCell:
		'text-[0.6875rem] font-semibold leading-[0.875rem] justify-start flex items-center first:pl-4',
	body: 'space-y-1 [&>:first-of-type]:mt-1',
	bodyRow: `bg-white py-2 rounded-md ${gridClassName} border border-transparent hover:border-primary transition-colors`,
	bodyCell: 'px-1'
};

export interface HistoryLinearTableProps {
	data: HistoryDataLinear[];
	pageCount: number;
	pagination: PaginationState;
	onPaginationChange: OnChangeFn<PaginationState>;
	globalFilter: HistoryLinearGlobalFilter;
	onGlobalFilterChange: OnChangeFn<HistoryLinearGlobalFilter>;
}

export const HistoryLinearTable: FC<HistoryLinearTableProps> = ({
	data,
	pageCount,
	pagination,
	globalFilter,
	onGlobalFilterChange,
	onPaginationChange
}) => {
	const state = useMemo<Partial<TableState>>(
		() => ({ pagination, globalFilter }),
		[globalFilter, pagination]
	);

	return (
		<TwTable
			data={data}
			columns={columns}
			state={state}
			globalFilterFn={globalFilterFn}
			onGlobalFilterChange={onGlobalFilterChange}
			onPaginationChange={onPaginationChange}
			getColumnCanGlobalFilter={() => true}
			classNames={classNames}
			pageCount={pageCount}
			stickyOffset={-1}
			manualPagination
			enableSorting={false}
		/>
	);
};
