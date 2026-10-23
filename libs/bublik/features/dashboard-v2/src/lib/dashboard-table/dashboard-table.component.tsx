/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { CSSProperties, ReactNode, useMemo, useState } from 'react';
import {
	Cell,
	ExpandedState,
	flexRender,
	getCoreRowModel,
	getExpandedRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	Header,
	Row,
	Table,
	useReactTable,
	ColumnMeta
} from '@tanstack/react-table';
import { fromDate, getLocalTimeZone } from '@internationalized/date';

import { SortArrow } from '@/icons';
import { DashboardAPIResponse, DashboardData } from '@/shared/types';
import { cn, Skeleton, SwitchDatePicker } from '@/shared/tailwind-ui';
import { splitInHalf } from '@/shared/utils';
import { BublikEmptyState, BublikErrorState } from '@/bublik/features/ui-state';

import { createColumns } from './dashboard-table.component.columns';
import { DashboardLayoutType } from './dashboard-table.types';
import {
	bodyCellStyles,
	DATE_PICKER_HEIGHT,
	datePickerStyles,
	gridStyles,
	headerCellStyles,
	rowStyles,
	subrowStyles
} from './dashboard-table.component.styles';
import {
	getGridTemplateColumns,
	isRowError
} from './dashboard-table.component.utils';

const DEFAULT_ROWS: DashboardAPIResponse['rows'] = [];

export const DashboardTableLoading = ({ rowNumber }: { rowNumber: number }) => {
	return (
		<div className="flex flex-col flex-grow gap-1">
			<Skeleton className="h-8.5" />
			<Skeleton className="h-8.5" />
			<ul className="flex flex-col gap-1">
				{Array.from({ length: rowNumber }, (_, idx) => idx).map((idx) => (
					<Skeleton key={idx} className="h-8.5 rounded-md" />
				))}
			</ul>
		</div>
	);
};

interface DashboardTableErrorProps {
	error: unknown;
}

export const DashboardTableError = ({ error }: DashboardTableErrorProps) => {
	return <BublikErrorState error={error} className="h-[calc(100vh-256px)]" />;
};

export const DashboardTableEmpty = () => {
	return (
		<BublikEmptyState
			title="No data"
			description="No data for this day present"
			className="h-[calc(100vh-256px)]"
			iconClassName="text-text-unexpected"
		/>
	);
};

export interface DashboardTableProps {
	date?: Date;
	headers?: DashboardAPIResponse['header'];
	rows?: DashboardAPIResponse['rows'];
	context: Record<string, string>;
	onDateChange?: (newDate: Date) => void;
	renderSubrow?: (row: Row<DashboardData>) => ReactNode;
	layout?: DashboardLayoutType;
	isFetching?: boolean;
	isLoading?: boolean;
	globalFilter?: string;
	error?: unknown;
	/** Hide the expand column, e.g. in TV mode. */
	showExpand?: boolean;
}

export const DashboardTable = (props: DashboardTableProps) => {
	const {
		headers = [],
		rows = DEFAULT_ROWS,
		layout = 'row',
		date = new Date(),
		onDateChange,
		isFetching = false,
		isLoading = false,
		globalFilter,
		renderSubrow,
		context,
		error,
		showExpand = true
	} = props;
	const [expanded, setExpanded] = useState<ExpandedState>({});

	const columns = useMemo(
		() => createColumns(headers, rows, date, context, { showExpand }),
		[context, date, headers, rows, showExpand]
	);
	const gridTemplateColumns = useMemo(
		() => getGridTemplateColumns(columns),
		[columns]
	);

	const table = useReactTable({
		state: { globalFilter, expanded },
		data: useMemo(() => rows, [rows]),
		columns,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getExpandedRowModel: getExpandedRowModel(),
		getSortedRowModel: getSortedRowModel(),
		onExpandedChange: setExpanded
	});

	const state = error ? (
		<DashboardTableError error={error} />
	) : isLoading ? (
		<DashboardTableLoading rowNumber={24} />
	) : rows.length ? null : (
		<DashboardTableEmpty />
	);

	const bodyRows = state ? [] : table.getRowModel().rows;
	const gridProps = {
		table,
		gridTemplateColumns,
		isFetching,
		renderSubrow
	} as const;

	return (
		<div role="table" className="flex flex-col w-full">
			<div className={datePickerStyles()}>
				<div className="bg-bg-primary h-8.5 flex items-center justify-center">
					<SwitchDatePicker
						label="Date"
						value={fromDate(date, getLocalTimeZone())}
						onChange={(value) =>
							value && onDateChange?.(value.toDate(getLocalTimeZone()))
						}
					/>
				</div>
			</div>
			{layout === 'row' ? (
				<TableGrid {...gridProps} rows={bodyRows} />
			) : (
				<div className="flex gap-1">
					{splitInHalf(bodyRows).map((half, idx) => (
						<TableGrid
							key={idx}
							{...gridProps}
							rows={half}
							className="flex-1 min-w-0"
						/>
					))}
				</div>
			)}
			{state ? <div className="mt-1">{state}</div> : null}
		</div>
	);
};

interface TableGridProps {
	table: Table<DashboardData>;
	rows: Row<DashboardData>[];
	gridTemplateColumns: string;
	isFetching: boolean;
	renderSubrow: DashboardTableProps['renderSubrow'];
	className?: string;
}

/**
 * One grid holding the header cells and every row's cells, so a track is
 * sized by the content of the whole column. Rows are `display: contents`
 * wrappers that keep the row-level test ids and the hover group.
 */
const TableGrid = (props: TableGridProps) => {
	const {
		table,
		rows,
		gridTemplateColumns,
		isFetching,
		renderSubrow,
		className
	} = props;
	const style: CSSProperties = { gridTemplateColumns };

	return (
		<div role="rowgroup" className={cn(gridStyles(), className)} style={style}>
			{table.getHeaderGroups().map((headerGroup) => (
				<div key={headerGroup.id} role="row" className={rowStyles()}>
					{headerGroup.headers.map(renderHeaderCell)}
				</div>
			))}
			{rows.map((row) => {
				const cells = row.getVisibleCells();
				const isExpanded = row.getIsExpanded();

				return (
					<div
						key={row.id}
						role="row"
						className={rowStyles()}
						data-testid="dashboard-row"
						data-run-id={row.original.context.run_id}
					>
						{cells.map((cell, idx) =>
							renderCell(cell, {
								isRowError: isRowError(row),
								isExpanded,
								isFetching,
								edge:
									idx === 0
										? 'first'
										: idx === cells.length - 1
										? 'last'
										: 'middle'
							})
						)}
						{isExpanded ? (
							<div className={subrowStyles({ isFetching })}>
								{renderSubrow?.(row)}
							</div>
						) : null}
					</div>
				);
			})}
		</div>
	);
};

/**
 * The sort arrow of a sortable header. It is laid out even while the column
 * is unsorted, only hidden, so sorting does not move the header. It leads
 * the label in a right-aligned header, so the label stays on the edge the
 * numbers align to, and trails it otherwise. It is a flex item with no base
 * width: when the track is at its minimum (a narrow row) it gives way
 * instead of holding the track open, and the sorted header is then told
 * apart by colour.
 */
const renderSortArrow = (
	header: Header<DashboardData, unknown>,
	side: 'leading' | 'trailing'
) => {
	if (!header.column.getCanSort()) return null;

	const direction = header.column.getIsSorted();

	return (
		<span
			className={cn(
				'w-0 min-w-0 max-w-3.5 flex-1 overflow-hidden flex',
				side === 'leading' ? 'mr-1 justify-end' : 'ml-1',
				!direction && 'invisible'
			)}
		>
			<SortArrow
				className={cn(
					// Scales down with its box instead of being clipped.
					'h-3.5 w-full',
					direction === 'asc' && 'translate-y-0.5 rotate-180',
					direction === 'desc' && '-translate-y-px'
				)}
			/>
		</span>
	);
};

const headerCellStyle: CSSProperties = { top: DATE_PICKER_HEIGHT };

/**
 * Left padding of a header cell: the cell padding, plus the badge's own
 * padding when the column has badges so the label sits over the badge text,
 * plus the gap after a right-aligned neighbour. Matches the body cells.
 */
const headerInset = (meta: ColumnMeta<DashboardData, unknown> | undefined) => {
	const overBadges = meta?.hasBadges && meta.align !== 'right';

	if (meta?.gapBefore) return overBadges ? 'pl-3.5' : 'pl-1.5';

	return overBadges ? 'pl-2.5' : undefined;
};

const renderHeaderCell = (header: Header<DashboardData, unknown>) => {
	const meta = header.column.columnDef.meta;
	const isRightAligned = meta?.align === 'right';

	return (
		<div
			role="columnheader"
			key={header.id}
			className={cn(
				headerCellStyles({ align: meta?.align, padded: !meta?.isIcon }),
				headerInset(meta),
				header.column.getCanSort() && 'cursor-pointer select-none',
				header.column.getIsSorted() && 'text-primary'
			)}
			style={headerCellStyle}
			onClick={header.column.getToggleSortingHandler()}
		>
			{isRightAligned ? renderSortArrow(header, 'leading') : null}
			{header.isPlaceholder
				? null
				: flexRender(header.column.columnDef.header, header.getContext())}
			{isRightAligned ? null : renderSortArrow(header, 'trailing')}
		</div>
	);
};

interface RenderCellOptions {
	isRowError: boolean;
	isExpanded: boolean;
	isFetching: boolean;
	edge: 'first' | 'last' | 'middle';
}

const renderCell = (
	cell: Cell<DashboardData, unknown>,
	{ isRowError, isExpanded, isFetching, edge }: RenderCellOptions
) => {
	const meta = cell.column.columnDef.meta;

	return (
		<div
			key={cell.id}
			role="cell"
			className={cn(
				bodyCellStyles({
					isRowError,
					isExpanded,
					isFetching,
					edge,
					align: meta?.align,
					padded: !meta?.isIcon,
					shrinks: meta?.shrinks
				}),
				// Room after a right-aligned neighbour; padding rather than margin
				// so the cell keeps painting the row background across it.
				meta?.gapBefore && 'pl-1.5'
			)}
		>
			{flexRender(cell.column.columnDef.cell, cell.getContext())}
		</div>
	);
};
