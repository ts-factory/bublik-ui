/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET Labs Ltd. */
import {
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	useReactTable
} from '@tanstack/react-table';

import { AccessToken } from '@/shared/types';
import { cn, Skeleton, TableSort } from '@/shared/tailwind-ui';
import { BublikEmptyState, BublikErrorState } from '@/bublik/features/ui-state';

import { adminColumns, columns } from './tokens-table.columns';

export const TokensTableLoading = () => {
	return (
		<div className="flex flex-col gap-1 mt-1">
			{Array.from({ length: 4 }, () => 0).map((_, idx) => (
				<Skeleton key={idx} className="h-10 rounded-md" />
			))}
		</div>
	);
};

interface TokensTableErrorProps {
	error: unknown;
}

export const TokensTableError = ({ error = {} }: TokensTableErrorProps) => {
	return <BublikErrorState error={error} className="h-64" />;
};

export const TokensTableEmpty = () => {
	return (
		<BublikEmptyState
			title="No access tokens"
			description="Create one to let an agent, a CI job or a script call Bublik as you."
			className="h-64"
		/>
	);
};

interface TokensTableProps {
	tokens: AccessToken[];
	/** The admin view spans every user, so it gains an owner column. */
	withOwner?: boolean;
}

export const TokensTable = ({ tokens, withOwner }: TokensTableProps) => {
	const table = useReactTable<AccessToken>({
		initialState: { sorting: [{ id: 'created', desc: true }] },
		data: tokens,
		columns: withOwner ? adminColumns : columns,
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
