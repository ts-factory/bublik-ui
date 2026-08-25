/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { Fragment, type ReactNode } from 'react';
import { flexRender, type Row, type Table } from '@tanstack/react-table';

import { TableSort, cn } from '@/shared/tailwind-ui';

/**
 * The run table's markup, factored out so every classification table looks the
 * same: ruled rows, a ruled header, and cells that share one border grid
 * rather than floating as separate rounded pills.
 *
 * Mirrors `run-table/components/{header,row}` — keep the class strings in step
 * with those if they change.
 */

export interface ClassificationTableProps<T> {
	table: Table<T>;
	/** Rendered in a full-width row under an expanded row. */
	renderSubRow?: (row: Row<T>) => ReactNode;
	/** Extra attributes per row, typically `data-*` hooks for e2e. */
	getRowAttributes?: (row: Row<T>) => Record<string, string | number>;
	testId?: string;
}

export function ClassificationTable<T>({
	table,
	renderSubRow,
	getRowAttributes,
	testId
}: ClassificationTableProps<T>) {
	return (
		<table
			className="w-full h-full p-0 m-0 border-separate border-spacing-0"
			data-testid={testId}
		>
			<thead className="text-left text-[0.6875rem] font-semibold leading-[0.875rem]">
				{table.getHeaderGroups().map((headerGroup) => (
					<tr key={headerGroup.id} className="h-8.5">
						{headerGroup.headers.map((header, idx, arr) => {
							const canSort = header.column.getCanSort();

							return (
								<th
									key={header.id}
									colSpan={header.colSpan}
									className={cn(
										'px-2 bg-primary-wash border-b border-border-primary',
										idx !== arr.length - 1 && 'border-r',
										header.column.columnDef.meta?.className
									)}
								>
									{header.isPlaceholder ? null : canSort ? (
										<div
											onClick={header.column.getToggleSortingHandler()}
											className={cn(
												'flex items-center gap-1 px-1 py-1 transition-colors rounded cursor-pointer select-none hover:bg-white/60',
												header.column.getIsSorted() && 'bg-white/60'
											)}
										>
											{flexRender(
												header.column.columnDef.header,
												header.getContext()
											)}
											<TableSort
												sortDescription={header.column.getIsSorted()}
											/>
										</div>
									) : (
										flexRender(
											header.column.columnDef.header,
											header.getContext()
										)
									)}
								</th>
							);
						})}
					</tr>
				))}
			</thead>
			<tbody className="text-[0.75rem] leading-[1.125rem] font-medium [&>*:not(:last-child)>*]:border-b [&>*:not(:last-child)>*]:border-border-primary">
				{table.getRowModel().rows.map((row) => (
					<Fragment key={row.id}>
						<tr
							className="relative h-full [&>*]:hover:bg-gray-50"
							{...getRowAttributes?.(row)}
						>
							{row.getVisibleCells().map((cell, idx, arr) => (
								<td
									key={cell.id}
									className={cn(
										'px-2 py-1 align-top bg-white',
										idx !== arr.length - 1 && 'border-r border-border-primary',
										cell.column.columnDef.meta?.className
									)}
								>
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</td>
							))}
						</tr>
						{renderSubRow && row.getIsExpanded() ? (
							<tr>
								<td
									colSpan={row.getVisibleCells().length}
									className="p-0 border-b bg-primary-wash/40 border-border-primary"
								>
									{renderSubRow(row)}
								</td>
							</tr>
						) : null}
					</Fragment>
				))}
			</tbody>
		</table>
	);
}

export interface ClassificationToolbarProps {
	children: ReactNode;
}

/** The run table's toolbar bar, minus the column controls. */
export function ClassificationToolbar({
	children
}: ClassificationToolbarProps) {
	return (
		<div className="flex flex-wrap items-center gap-2 px-4 py-1 bg-white border-b border-border-primary">
			{children}
		</div>
	);
}
