/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable
} from '@tanstack/react-table';

import { User } from '@/shared/types';
import {
	cn,
	Icon,
	Pagination,
	Skeleton,
	TableSort
} from '@/shared/tailwind-ui';

import { columns } from './users-table.columns';
import { getErrorMessage } from '@/services/bublik-api';

export const UsersTableLoading = () => {
	return (
		<div className="flex flex-col gap-1 mt-1">
			{Array.from({ length: 25 }, () => 0).map((_, idx) => (
				<Skeleton key={idx} className="h-10 rounded-md" />
			))}
		</div>
	);
};

interface UsersTableErrorProps {
	error: unknown;
}

export const UsersTableError = (props: UsersTableErrorProps) => {
	const { error = {} } = props;
	const { title, description, status } = getErrorMessage(error);

	return (
		<div className="grid place-items-center h-[calc(100vh-256px)]">
			<div className="flex flex-col items-center text-center">
				<Icon
					name="TriangleExclamationMark"
					size={24}
					className="text-text-unexpected"
				/>
				<h3 className="mt-2 text-sm font-medium text-gray-900">
					{status} {title}
				</h3>
				<p className="mt-1 text-sm text-gray-500">{description}</p>
			</div>
		</div>
	);
};

export const UsersTableEmpty = () => {
	return (
		<div className="grid place-items-center h-[calc(100vh-256px)]">
			<div className="flex flex-col items-center text-center">
				<Icon
					name="TriangleExclamationMark"
					size={24}
					className="text-text-unexpected"
				/>
				<h3 className="mt-2 text-sm font-medium text-gray-900">No results!</h3>
				<p className="mt-1 text-sm text-gray-500">No results found!</p>
			</div>
		</div>
	);
};

interface UsersTableProps {
	users: User[];
}

export const UsersTable = (props: UsersTableProps) => {
	const { users } = props;

	const table = useReactTable<User>({
		initialState: {
			pagination: { pageIndex: 0, pageSize: 25 },
			sorting: [{ id: 'email', desc: true }]
		},
		data: users,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel()
	});

	return (
		<div className="overflow-x-auto">
			<table className="min-w-full border-separate table-fixed border-spacing-y-1">
				<thead className="bg-white">
					{table.getHeaderGroups().map((headerGroup) => (
						<tr key={headerGroup.id} className="h-8.5">
							{headerGroup.headers.map((header) => (
								<th key={header.id} colSpan={header.colSpan}>
									{header.isPlaceholder ? null : (
										<div
											className={cn(
												'flex items-center gap-1 px-4 py-2 font-bold text-[0.6875rem] leading-[0.875rem] tracking-wider text-left uppercase transition-colors select-none',
												header.column.getIsSorted() && 'bg-primary-wash',
												header.column.getCanSort() &&
													'hover:bg-primary-wash cursor-pointer rounded-md'
											)}
											{...(header.column.getCanSort() && {
												onClick: header.column.getToggleSortingHandler()
											})}
										>
											{flexRender(
												header.column.columnDef.header,
												header.getContext()
											)}
											{header.column.getCanSort() && (
												<TableSort
													sortDescription={header.column.getIsSorted()}
												/>
											)}
										</div>
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
									className="px-4 py-2 text-sm font-medium transition-colors border-t border-b border-transparent text-text-primary whitespace-nowrap first:border-l last:border-r first:rounded-l last:rounded-r group-hover:border-primary group-hover:first:border-primary group-hover:last:border-primary"
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
					totalCount={users.length}
					pageSize={table.getState().pagination.pageSize}
					onPageChange={(page) => table.setPageIndex(page - 1)}
					onPageSizeChange={table.setPageSize}
					currentPage={table.getState().pagination.pageIndex + 1}
				/>
			</div>
		</div>
	);
};
