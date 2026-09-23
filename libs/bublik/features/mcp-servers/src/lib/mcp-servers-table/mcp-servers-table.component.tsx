/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET Labs Ltd. */
import {
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	useReactTable
} from '@tanstack/react-table';

import { McpServer } from '@/shared/types';
import { cn, Skeleton, TableSort } from '@/shared/tailwind-ui';
import { BublikEmptyState, BublikErrorState } from '@/bublik/features/ui-state';

import { columns } from './mcp-servers-table.columns';

export const McpServersTableLoading = () => {
	return (
		<div className="flex flex-col gap-1 mt-1">
			{Array.from({ length: 3 }, () => 0).map((_, idx) => (
				<Skeleton key={idx} className="h-10 rounded-md" />
			))}
		</div>
	);
};

interface McpServersTableErrorProps {
	error: unknown;
}

export const McpServersTableError = ({
	error = {}
}: McpServersTableErrorProps) => {
	return <BublikErrorState error={error} className="h-64" />;
};

export const McpServersTableEmpty = () => {
	return (
		<BublikEmptyState
			title="No MCP servers"
			description="Add one to give the assistant its tools in your chats."
			className="h-64"
		/>
	);
};

interface McpServersTableProps {
	servers: McpServer[];
}

export const McpServersTable = ({ servers }: McpServersTableProps) => {
	const table = useReactTable<McpServer>({
		initialState: { sorting: [{ id: 'name', desc: false }] },
		data: servers,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel()
	});

	return (
		<div className="overflow-x-auto">
			<table className="min-w-full border-separate border-spacing-y-1">
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
		</div>
	);
};
