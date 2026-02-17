/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useMemo, MouseEvent, useState } from 'react';
import {
	PaginationState,
	OnChangeFn,
	TableState,
	RowSelectionState,
	useReactTable,
	getCoreRowModel,
	getPaginationRowModel,
	flexRender,
	Row,
	getSortedRowModel
} from '@tanstack/react-table';

import { RunsData } from '@/shared/types';
import { Skeleton, cn, Pagination } from '@/shared/tailwind-ui';
import { BublikEmptyState, BublikErrorState } from '@/bublik/features/ui-state';

import { columns } from './runs-table.columns';
import { globalFilterFn } from './runs-table.utils';

const getRowId = (runsData: RunsData) => runsData.id.toString();
const MAX_SELECTION_NUMBER = 9999;

export interface RunsTableProps {
	data: RunsData[];
	pagination: PaginationState;
	onPaginationChange: OnChangeFn<PaginationState>;
	pageCount: number;
	globalFilter: string[];
	onGlobalFilterChange: OnChangeFn<string[]>;
	rowSelection: RowSelectionState;
	selection: string[];
	addSelection: (runId: string) => void;
	removeSelection: (runId: string) => void;
}

function RunsTable(props: RunsTableProps) {
	const {
		data,
		pagination,
		onPaginationChange,
		pageCount,
		onGlobalFilterChange,
		globalFilter,
		rowSelection,
		addSelection,
		removeSelection,
		selection
	} = props;

	const state = useMemo<Partial<TableState>>(
		() => ({ pagination, globalFilter, rowSelection }),
		[globalFilter, pagination, rowSelection]
	);

	const table = useReactTable<RunsData>({
		data,
		columns,
		state,
		pageCount,
		onPaginationChange,
		globalFilterFn,
		onGlobalFilterChange,
		getRowId,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		manualPagination: true
	});

	const { pageIndex, pageSize } = table.getState().pagination;

	function handleRowClick(row: Row<RunsData>) {
		return (e: MouseEvent<HTMLTableRowElement>) => {
			if (
				e.target instanceof Element &&
				e.target.tagName !== 'DIV' &&
				e.target.tagName !== 'TD'
			) {
				return;
			}

			const selectionState = table.getState().rowSelection;
			const selectionKeys = Object.keys(selectionState);
			const isMaxLength = selectionKeys.length === MAX_SELECTION_NUMBER;

			const isInSelection = selectionKeys.includes(row.original.id.toString());

			if (isInSelection) {
				removeSelection(row.id);
				return;
			}

			if (isMaxLength) {
				const oldestId = selection.at(0);
				if (oldestId) removeSelection(oldestId);
				addSelection(row.id);
				return;
			}

			addSelection(row.id);
		};
	}

	return (
		<div>
			<table className="border-separate border-spacing-y-1 h-full p-0 m-0 w-full">
				<thead>
					{table.getHeaderGroups().map((headerGroup) => (
						<tr key={headerGroup.id} className="h-8">
							{headerGroup.headers.map((header) => {
								const headerClassName =
									header.column.columnDef.meta?.headerClassName || '';

								return (
									<th
										key={header.id}
										className={cn(
											'py-2 px-1 text-[0.6875rem] font-semibold leading-[0.875rem] text-left bg-white sticky top-0 z-10',
											headerClassName
										)}
									>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext()
											  )}
									</th>
								);
							})}
						</tr>
					))}
				</thead>
				<tbody>
					{table.getRowModel().rows.map((row) => {
						return (
							<RunsRow key={row.id} row={row} onRowClick={handleRowClick} />
						);
					})}
				</tbody>
			</table>
			{pageCount ? (
				<div className="flex justify-center">
					<Pagination
						totalCount={pageCount}
						currentPage={pageIndex + 1}
						pageSize={pageSize}
						onPageChange={(page) => table.setPageIndex(page - 1)}
						onPageSizeChange={table.setPageSize}
					/>
				</div>
			) : null}
		</div>
	);
}

interface RunsRowProps {
	row: Row<RunsData>;
	onRowClick: (
		row: Row<RunsData>
	) => (e: MouseEvent<HTMLTableRowElement>) => void;
}

function RunsRow({ row, onRowClick }: RunsRowProps) {
	const isSelected = row.getIsSelected();
	const [isHovered, setIsHovered] = useState(false);

	return (
		<tr onClick={onRowClick(row)}>
			{row.getVisibleCells().map((cell, cellIdx, cells) => {
				const className = cell.column.columnDef.meta?.className || '';

				return (
					<td
						key={cell.id}
						className={cn(
							`bg-white py-2 px-1 border-transparent transition-colors`,
							cellIdx !== 0 && 'border-y',
							cellIdx === cells.length - 1 && 'border-r rounded-r',
							isHovered && 'border-primary',
							isSelected && 'bg-primary-wash border-primary',
							className
						)}
						onMouseEnter={() => setIsHovered(true)}
						onMouseLeave={() => setIsHovered(false)}
					>
						{flexRender(cell.column.columnDef.cell, cell.getContext())}
					</td>
				);
			})}
		</tr>
	);
}

export const RunsTableLoading = (props: { count: number }) => {
	return (
		<div className="flex flex-col gap-1">
			<Skeleton className="h-[32px]" />
			{Array.from({ length: props.count }).map((_, idx) => (
				<Skeleton key={idx} className="h-[110px] rounded" />
			))}
		</div>
	);
};

export interface RunsTableErrorProps {
	error?: unknown;
}

export const RunsTableError = (props: RunsTableErrorProps) => {
	const { error = {} } = props;

	return <BublikErrorState error={error} className="h-[calc(100vh-256px)]" />;
};

export const RunsTableEmpty = () => {
	return (
		<BublikEmptyState
			title="No runs found"
			description="Try changing your search or filter to find what you are looking for"
			className="h-[calc(100vh-256px)]"
		/>
	);
};

export { RunsTable };
