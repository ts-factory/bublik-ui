/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC, Fragment, useMemo, useRef, useState } from 'react';
import {
	OnChangeFn,
	PaginationState,
	Row,
	TableState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	useReactTable
} from '@tanstack/react-table';

import { HistoryDataLinear } from '@/shared/types';
import { useIsSticky } from '@/shared/hooks';
import { Pagination, Skeleton, cn } from '@/shared/tailwind-ui';

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

/**
 * The whole table is a single grid, so the column tracks are declared once here
 * from the column defs rather than repeated on the header row and on every body
 * row. Cells are emitted flat into it — a row has no wrapper element, which is
 * what lets a track size against every row at once.
 */
const gridTemplateColumns = columns
	.map((column) => column.meta?.width ?? 'minmax(0, 1fr)')
	.join(' ');

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

	const table = useReactTable<HistoryDataLinear>({
		data,
		columns,
		pageCount,
		state,
		globalFilterFn,
		onGlobalFilterChange,
		onPaginationChange,
		getColumnCanGlobalFilter: () => true,
		manualPagination: true,
		enableSorting: false,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel()
	});

	const { pageIndex, pageSize } = table.getState().pagination;

	const headerRef = useRef<HTMLDivElement | null>(null);
	const { isSticky } = useIsSticky(headerRef, { offset: -1 });

	return (
		<>
			<div className="grid" style={{ gridTemplateColumns }}>
				{table.getHeaderGroups().map((headerGroup) => (
					<Fragment key={headerGroup.id}>
						{headerGroup.headers.map((header, idx, headers) => (
							<div
								key={header.id}
								ref={(el) => {
									if (idx === 0) headerRef.current = el;
								}}
								className={cn(
									'sticky top-0 z-10 h-10 flex items-center justify-start bg-white',
									'text-[0.6875rem] font-semibold leading-[0.875rem]',
									idx === 0 && 'rounded-bl pl-4',
									idx === headers.length - 1 && 'rounded-br'
								)}
								style={{
									// A single shadow spanning the header is not available now
									// that the header is one element per cell: applied to each
									// cell it would draw down the seams between them. Offsetting
									// it sideways makes each cell's shadow fall under its
									// neighbour instead.
									boxShadow: isSticky
										? `rgba(0, 0, 0, 0.1) ${idx === 0 ? 0 : 7}px 2px 10px`
										: 'none'
								}}
							>
								{header.isPlaceholder
									? null
									: flexRender(
											header.column.columnDef.header,
											header.getContext()
									  )}
							</div>
						))}
					</Fragment>
				))}
				{table.getRowModel().rows.map((row) => (
					<HistoryLinearRow key={row.id} row={row} />
				))}
			</div>
			{pageCount ? (
				<div className="flex justify-center mt-1">
					<Pagination
						totalCount={table.getPageCount()}
						currentPage={pageIndex + 1}
						pageSize={pageSize}
						onPageChange={(page) => table.setPageIndex(page - 1)}
						onPageSizeChange={table.setPageSize}
					/>
				</div>
			) : null}
		</>
	);
};

interface HistoryLinearRowProps {
	row: Row<HistoryDataLinear>;
}

/**
 * A row's cells, emitted straight into the table's grid. With no row element to
 * carry them, the card look and the hover outline are rebuilt per cell: the ends
 * round and close the border, and hover is state rather than a CSS `hover:`.
 */
function HistoryLinearRow({ row }: HistoryLinearRowProps) {
	const [hovered, setHovered] = useState(false);
	const cells = row.getVisibleCells();

	return (
		<Fragment>
			{cells.map((cell, idx) => {
				const isFirst = idx === 0;
				const isLast = idx === cells.length - 1;

				return (
					<div
						key={cell.id}
						onMouseEnter={() => setHovered(true)}
						onMouseLeave={() => setHovered(false)}
						className={cn(
							'mt-1 bg-white px-1 py-2 border-y border-y-transparent transition-colors',
							isFirst && 'rounded-l-md border-l border-l-transparent',
							isLast && 'rounded-r-md border-r border-r-transparent',
							hovered && 'border-y-primary',
							hovered && isFirst && 'border-l-primary',
							hovered && isLast && 'border-r-primary'
						)}
					>
						{flexRender(cell.column.columnDef.cell, cell.getContext())}
					</div>
				);
			})}
		</Fragment>
	);
}
