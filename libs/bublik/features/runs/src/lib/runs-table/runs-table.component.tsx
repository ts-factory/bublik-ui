/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	useMemo,
	MouseEvent,
	useState,
	useRef,
	useEffect,
	RefObject
} from 'react';
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

import { columns, METADATA_COLUMN_ID } from './runs-table.columns';
import { RunCommentChip } from './run-comment-chip.component';
import { runCommentOf } from './run-comment.utils';
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
	/** The run whose comment editor is open. */
	editingCommentRunId: number | null;
	onEditComment: (runId: number, comment: string) => void;
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
		selection,
		editingCommentRunId,
		onEditComment
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
		<div>
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
						{table.getRowModel().rows.map((row, rowIdx) => {
							return (
								<RunsRow
									key={row.id}
									row={row}
									isFirst={rowIdx === 0}
									isEditingComment={editingCommentRunId === row.original.id}
									onEditComment={onEditComment}
									onRowClick={handleRowClick}
								/>
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
		</div>
	);
}

/** The height of the header row, `h-8`. */
const HEADER_ROW_HEIGHT = 32;

/**
 * Whether the element's top is below the sticky header, or yet to pass
 * beneath it: the same watch the result table keeps for its row marks.
 * A 1px edge is watched, as a taller element would be judged by its
 * visible part.
 */
function useIsBelowHeader(
	ref: RefObject<HTMLElement>,
	enabled: boolean
): boolean {
	const [isBelow, setIsBelow] = useState(true);

	useEffect(() => {
		const el = ref.current;

		if (!enabled || !el) return;

		const observer = new IntersectionObserver(
			([entry]) =>
				setIsBelow(
					entry.isIntersecting ||
						// Out of sight below the viewport is below the header too.
						entry.boundingClientRect.top >
							(entry.rootBounds?.bottom ?? Number.POSITIVE_INFINITY)
				),
			{ rootMargin: `${-HEADER_ROW_HEIGHT}px 0px 0px 0px`, threshold: [0] }
		);

		observer.observe(el);
		return () => observer.disconnect();
	}, [ref, enabled]);

	return isBelow;
}

interface RunsRowProps {
	row: Row<RunsData>;
	isFirst: boolean;
	isEditingComment: boolean;
	onEditComment: (runId: number, comment: string) => void;
	onRowClick: (
		row: Row<RunsData>
	) => (e: MouseEvent<HTMLTableRowElement>) => void;
}

function RunsRow(props: RunsRowProps) {
	const { row, isFirst, isEditingComment, onEditComment, onRowClick } = props;
	const isSelected = row.getIsSelected();
	const [isHovered, setIsHovered] = useState(false);
	const runId = row.original.id;
	const comment = runCommentOf(row.original);
	// Only the first row's comment reaches into the header, and has to give
	// way once the row scrolls beneath it.
	const topEdgeRef = useRef<HTMLSpanElement>(null);
	const isBelowHeader = useIsBelowHeader(topEdgeRef, isFirst);

	return (
		<tr
			data-testid="runs-row"
			data-run-id={row.original.id}
			onClick={onRowClick(row)}
		>
			{row.getVisibleCells().map((cell, cellIdx, cells) => {
				const className = cell.column.columnDef.meta?.className || '';
				// The comment sits over the run's metadata.
				const holdsComment = cell.column.id === METADATA_COLUMN_ID;

				return (
					<td
						key={cell.id}
						data-column-id={cell.column.id}
						className={cn(
							// The top padding makes room for the comment's lower half.
							`bg-bg-primary pt-3 pb-2 px-1 border-transparent transition-colors`,
							cellIdx !== 0 && 'border-y',
							cellIdx === cells.length - 1 && 'border-r rounded-r',
							isHovered && 'border-primary',
							isSelected && 'bg-primary-wash border-primary',
							holdsComment && 'relative',
							className
						)}
						onMouseEnter={() => setIsHovered(true)}
						onMouseLeave={() => setIsHovered(false)}
					>
						{flexRender(cell.column.columnDef.cell, cell.getContext())}
						{holdsComment ? (
							<>
								{isFirst ? (
									<span
										ref={topEdgeRef}
										aria-hidden
										className="pointer-events-none absolute left-0 top-0 h-px w-px"
									/>
								) : null}
								<RunCommentChip
									runId={runId}
									comment={comment}
									isRowHovered={isHovered}
									isEditing={isEditingComment}
									overHeader={isFirst && isBelowHeader}
									onEdit={() => onEditComment(runId, comment)}
								/>
							</>
						) : null}
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
