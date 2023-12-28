/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import React, { DetailedHTMLProps, HTMLAttributes, useRef } from 'react';
import {
	useReactTable,
	getCoreRowModel,
	getExpandedRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	getFilteredRowModel,
	flexRender,
	ColumnDef,
	TableOptions,
	Table,
	Row,
	Cell,
	Header,
	HeaderGroup
} from '@tanstack/react-table';

import { config } from '@/bublik/config';
import { useIsSticky } from '@/shared/hooks';
import { isFunction } from '@/shared/utils';

import { cn } from '../utils';
import { Pagination } from '../pagination';
import { TableSort } from '../table-sort';

const shadowStyle = { boxShadow: '0 0 15px 0 rgb(0 0 0 / 10%)' };

export interface TwHeaderProps<T extends Record<string, unknown>>
	extends Pick<
		TwTableProps<T>,
		'classNames' | 'stickyOffset' | 'getHeaderCellProps' | 'getHeaderRowProps'
	> {
	table: Table<T>;
}
const TwHeader = <T extends Record<string, unknown>>(
	props: TwHeaderProps<T>
) => {
	const {
		table,
		classNames,
		stickyOffset,
		getHeaderCellProps,
		getHeaderRowProps
	} = props;
	const headerRef = useRef(null);
	const { isSticky } = useIsSticky(headerRef, { offset: stickyOffset });

	return (
		<div
			role="rowgroup"
			className={cn('tw-table-header', classNames?.header)}
			style={isSticky && stickyOffset ? shadowStyle : undefined}
			ref={headerRef}
		>
			{table.getHeaderGroups().map((headerGroup) => (
				<div
					role="row"
					key={headerGroup.id}
					className={cn(
						'tw-table-row tw-table-header-row',
						classNames?.headerRow
					)}
					{...getHeaderRowProps?.(table, headerGroup)}
				>
					{headerGroup.headers.map((header) => (
						<div
							role="columnheader"
							key={header.id}
							{...{
								className: cn(
									`tw-table-cell tw-table-header-cell tw-table-cell-${header.id}`,
									header.column.getCanSort() && 'cursor-pointer select-none',
									isFunction(classNames?.headerCell)
										? classNames?.headerCell(header)
										: classNames?.headerCell
								),
								onClick: header.column.getCanSort()
									? header.column.getToggleSortingHandler()
									: undefined
							}}
							{...getHeaderCellProps?.(table, header)}
						>
							{header.isPlaceholder
								? null
								: flexRender(
										header.column.columnDef.header,
										header.getContext()
								  )}
							{header.column.getCanSort() && (
								<div className="pl-2">
									<TableSort sortDescription={header.column.getIsSorted()} />
								</div>
							)}
						</div>
					))}
				</div>
			))}
		</div>
	);
};

export interface TableClassNames<T extends Record<string, unknown>> {
	table?: string;
	header?: string;
	headerRow?: string;
	headerCell?: string | ((header: Header<T, unknown>) => string);
	body?: string;
	bodyRow?: string | ((row: Row<T>) => string);
	bodyCell?: string | ((cell: Cell<T, unknown>) => string);
}

export interface TwTableProps<T extends Record<string, unknown>>
	extends Partial<TableOptions<T>> {
	/** Table Rows */
	data: T[];
	/** Table columns for cell rendering */
	columns: ColumnDef<T>[];
	/** Table classnames */
	classNames?: TableClassNames<T>;
	/** Display shadow when reached */
	stickyOffset?: number;
	getRowProps?: (
		table: Table<T>,
		row: Row<T>
	) => DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
	getHeaderCellProps?: (
		table: Table<T>,
		headerCell: Header<T, unknown>
	) => DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
	getCellProps?: (
		table: Table<T>,
		headerCell: Cell<T, unknown>
	) => DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
	getHeaderRowProps?: (
		table: Table<T>,
		row: HeaderGroup<T>
	) => DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
}

export const TwTable = <T extends Record<string, unknown>>(
	props: TwTableProps<T>
) => {
	const {
		pageCount,
		classNames,
		stickyOffset,
		getRowProps,
		getCellProps,
		getHeaderCellProps,
		...rest
	} = props;

	const table = useReactTable<T>({
		pageCount,
		getCoreRowModel: getCoreRowModel(),
		getExpandedRowModel: getExpandedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		debugTable: config.isDev,
		...rest
	});

	const state = table.getState();
	const { pageSize, pageIndex } = state.pagination;

	const pagination = pageCount ? (
		<div className="flex justify-center mt-1">
			<Pagination
				totalCount={table.getPageCount()}
				currentPage={pageIndex + 1}
				pageSize={pageSize}
				onPageChange={(page) => table.setPageIndex(page - 1)}
				onPageSizeChange={table.setPageSize}
			/>
		</div>
	) : null;

	return (
		<React.Fragment>
			<div role="table" className={cn('tw-table', classNames?.table)}>
				{/* Header */}
				<TwHeader
					table={table}
					classNames={classNames}
					stickyOffset={stickyOffset}
				/>
				{/* Body */}
				<div role="rowgroup" className={cn('tw-table-body', classNames?.body)}>
					{table.getRowModel().rows.map((row) => (
						<div
							role="row"
							key={row.id}
							{...{
								...getRowProps?.(table, row),
								className: cn(
									'tw-table-row',
									isFunction(classNames?.bodyRow)
										? classNames?.bodyRow(row)
										: classNames?.bodyRow,
									getRowProps?.(table, row)?.className
								)
							}}
						>
							{row.getVisibleCells().map((cell) => (
								<div
									role="cell"
									key={cell.id}
									className={cn(
										`tw-table-cell tw-table-cell-${cell.column.id}`,
										isFunction(classNames?.bodyCell)
											? classNames?.bodyCell(cell)
											: classNames?.bodyCell
									)}
									{...getCellProps?.(table, cell)}
								>
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</div>
							))}
						</div>
					))}
				</div>
			</div>
			{pagination}
		</React.Fragment>
	);
};
