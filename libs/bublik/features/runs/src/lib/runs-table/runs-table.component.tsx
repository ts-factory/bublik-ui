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

import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import { RunsData } from '@/shared/types';
import { Skeleton, cn, Pagination } from '@/shared/tailwind-ui';
import { BublikEmptyState, BublikErrorState } from '@/bublik/features/ui-state';

import { columns } from './runs-table.columns';
// PROTOTYPE: run comment variants, see ../runs-comments-prototype.
import {
	CommentCornerChip,
	CommentStripRow,
	RunsCommentsPrototypeLayout,
	prototypeColumns,
	useCommentsPanel,
	useRunComment,
	useRunsCommentVariant
} from '../runs-comments-prototype';
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
	replaceSelection: (oldRunId: string, newRunId: string) => void;
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
		replaceSelection,
		selection
	} = props;

	const state = useMemo<Partial<TableState>>(
		() => ({ pagination, globalFilter, rowSelection }),
		[globalFilter, pagination, rowSelection]
	);

	// PROTOTYPE
	const variant = useRunsCommentVariant();
	const tableColumns = useMemo(
		() => prototypeColumns(columns, variant),
		[variant]
	);

	const table = useReactTable<RunsData>({
		data,
		columns: tableColumns,
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
				trackEvent(analyticsEventNames.runsRowSelectionChange, {
					action: 'remove',
					selectionCount: selectionKeys.length - 1,
					source: 'table_row'
				});
				return;
			}

			if (isMaxLength) {
				const oldestId = selection.at(0);
				if (oldestId) replaceSelection(oldestId, row.id);
				else addSelection(row.id);
				trackEvent(analyticsEventNames.runsRowSelectionChange, {
					action: 'replace_oldest',
					selectionCount: selectionKeys.length,
					source: 'table_row'
				});
				return;
			}

			addSelection(row.id);
			trackEvent(analyticsEventNames.runsRowSelectionChange, {
				action: 'add',
				selectionCount: selectionKeys.length + 1,
				source: 'table_row'
			});
		};
	}

	return (
		<RunsCommentsPrototypeLayout variant={variant} runs={data}>
			<div className="-mt-1">
				{/* border-spacing adds outer spacing above the first row; offset it to keep a 4px page-level gap */}
				<table
					data-testid="runs-table"
					className="border-separate border-spacing-y-1 h-full p-0 m-0 w-full"
				>
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
												'py-2 px-1 text-[0.6875rem] font-semibold leading-[0.875rem] text-left bg-bg-primary sticky top-0 z-10',
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
			</div>
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
		</RunsCommentsPrototypeLayout>
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
	// PROTOTYPE: B and C draw the comment on the row itself; D outlines the
	// row its panel entry points at.
	const variant = useRunsCommentVariant();
	const runId = row.original.id;
	const comment = useRunComment(runId, variant !== 'B' && variant !== 'C');
	const { activeRunId } = useCommentsPanel();
	const hasStrip = variant === 'C' && comment !== '';
	const cells = row.getVisibleCells();

	return (
		<>
			<tr
				data-testid="runs-row"
				data-run-id={row.original.id}
				onClick={onRowClick(row)}
			>
				{cells.map((cell, cellIdx) => {
					const className = cell.column.columnDef.meta?.className || '';

					return (
						<td
							key={cell.id}
							data-column-id={cell.column.id}
							rowSpan={hasStrip && cellIdx === 0 ? 2 : undefined}
							className={cn(
								`bg-bg-primary py-2 px-1 border-transparent transition-colors`,
								cellIdx !== 0 && 'border-y',
								cellIdx === cells.length - 1 && 'border-r rounded-r',
								isHovered && 'border-primary',
								isSelected && 'bg-primary-wash border-primary',
								variant === 'D' && activeRunId === runId && 'border-primary',
								// Room for the lower half of the corner chip.
								variant === 'B' && cellIdx !== 0 && 'pt-4',
								variant === 'B' && cellIdx === 1 && 'relative',
								hasStrip && cellIdx === cells.length - 1 && 'rounded-br-none',
								className
							)}
							onMouseEnter={() => setIsHovered(true)}
							onMouseLeave={() => setIsHovered(false)}
						>
							{flexRender(cell.column.columnDef.cell, cell.getContext())}
							{variant === 'B' && cellIdx === 1 ? (
								<CommentCornerChip
									runId={runId}
									comment={comment}
									isRowHovered={isHovered}
								/>
							) : null}
						</td>
					);
				})}
			</tr>
			{hasStrip ? (
				<CommentStripRow
					runId={runId}
					comment={comment}
					colSpan={cells.length - 1}
				/>
			) : null}
		</>
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
