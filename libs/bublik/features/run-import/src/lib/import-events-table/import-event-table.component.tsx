/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	useReactTable
} from '@tanstack/react-table';

import { LogEvent } from '@/shared/types';
import { getErrorMessage } from '@/services/bublik-api';
import { cn, Icon, Pagination, Skeleton } from '@/shared/tailwind-ui';

import { columns } from './import-event-table.columns';

export const ImportEventTableLoading = () => {
	return (
		<div className="flex flex-col gap-1 mt-1">
			<Skeleton className="h-10" />
			{Array(25)
				.fill(0)
				.map((_, idx) => (
					<Skeleton key={idx} className="rounded h-[52.5px]" />
				))}
		</div>
	);
};

export interface ImportEventTableErrorProps {
	error: unknown;
}

export const ImportEventTableError = (props: ImportEventTableErrorProps) => {
	const { description, status, title } = getErrorMessage(props.error);

	return (
		<div className="flex items-center justify-center flex-grow h-screen">
			<div className="flex items-center gap-4">
				<Icon
					name="TriangleExclamationMark"
					size={48}
					className="text-text-unexpected"
				/>
				<div className="flex flex-col gap-0.5">
					<h2 className="text-2xl font-bold">
						{status} {title}
					</h2>
					<p className="text-lg">{description}</p>
				</div>
			</div>
		</div>
	);
};

export const ImportEventTableEmpty = () => {
	return (
		<div className="grid place-items-center h-[calc(100vh-176px)]">
			<div className="flex flex-col items-center text-center">
				<Icon
					name="TriangleExclamationMark"
					size={48}
					className="text-text-unexpected"
				/>
				<h3 className="mt-2 text-sm font-medium text-gray-900">
					No results found
				</h3>
				<p className="mt-1 text-sm text-gray-500">
					No results found, please try another search.
				</p>
			</div>
		</div>
	);
};

export interface ImportEventTableProps {
	data: LogEvent[];
}

export const ImportEventTable = (props: ImportEventTableProps) => {
	const table = useReactTable({
		initialState: { pagination: { pageIndex: 0, pageSize: 25 } },
		data: props.data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel()
	});

	return (
		<div>
			<table className="border-separate border-spacing-y-1 w-full">
				<thead className={cn('bg-white sticky top-0 z-10')}>
					{table.getHeaderGroups().map((headerGroup) => (
						<tr key={headerGroup.id} className="h-8.5">
							{headerGroup.headers.map((header) => (
								<th
									key={header.id}
									colSpan={header.colSpan}
									className="px-6 py-3 font-bold text-[0.6875rem] leading-[0.875rem] tracking-wider text-left uppercase"
								>
									{header.isPlaceholder
										? null
										: flexRender(
												header.column.columnDef.header,
												header.getContext()
											)}
								</th>
							))}
						</tr>
					))}
				</thead>
				<tbody className="bg-white">
					{table.getRowModel().rows.map((row) => (
						<tr key={row.id} className="group">
							{row.getVisibleCells().map((cell) => (
								<td
									key={cell.id}
									className="px-6 py-4 text-sm font-medium transition-colors border-t border-b border-transparent text-text-primary whitespace-nowrap first:border-l last:border-r first:rounded-l last:rounded-r group-hover:border-primary group-hover:first:border-primary group-hover:last:border-primary"
								>
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
			<div className="flex items-center justify-center">
				<Pagination
					totalCount={props.data.length}
					pageSize={table.getState().pagination.pageSize}
					onPageChange={(page) => table.setPageIndex(page - 1)}
					onPageSizeChange={table.setPageSize}
					currentPage={table.getState().pagination.pageIndex + 1}
				/>
			</div>
		</div>
	);
};
