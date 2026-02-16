/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	CSSProperties,
	Fragment,
	ReactNode,
	SVGProps,
	useMemo,
	useState
} from 'react';
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
	useReactTable
} from '@tanstack/react-table';
import { fromDate, getLocalTimeZone } from '@internationalized/date';

import { DashboardAPIResponse, DashboardData } from '@/shared/types';
import { cn, Skeleton, SwitchDatePicker } from '@/shared/tailwind-ui';
import { splitInHalf } from '@/shared/utils';
import { BublikEmptyState, BublikErrorState } from '@/bublik/features/ui-state';

import { createColumns } from './dashboard-table.component.columns';
import { DashboardLayoutType } from './dashboard-table.types';
import {
	bodyCellStyles,
	bodyRowStyles,
	bodyRowWrapperStyles,
	headerCellStyles,
	headerRowStyles
} from './dashboard-table.component.styles';
import { isRowError } from './dashboard-table.component.utils';

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
	globalFilter?: string;
	error?: unknown;
}

export const DashboardTable = (props: DashboardTableProps) => {
	const {
		headers = [],
		rows = DEFAULT_ROWS,
		layout = 'row',
		date = new Date(),
		onDateChange,
		isFetching,
		globalFilter,
		renderSubrow,
		context,
		error
	} = props;
	const [expanded, setExpanded] = useState<ExpandedState>({});

	const table = useReactTable({
		state: { globalFilter, expanded },
		data: useMemo(() => rows, [rows]),
		columns: useMemo(
			() => createColumns(headers, rows, date, context),
			[context, date, headers, rows]
		),
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getExpandedRowModel: getExpandedRowModel(),
		getSortedRowModel: getSortedRowModel(),
		onExpandedChange: setExpanded
	});

	const state = {
		empty: <DashboardTableEmpty />,
		error: <DashboardTableError error={error} />,
		data: (
			<TableBody
				table={table}
				layout={layout}
				isFetching={isFetching}
				renderSubrow={renderSubrow}
			/>
		)
	};

	return (
		<div role="table" className="flex flex-col w-full gap-1">
			<div className="sticky top-0 z-40">
				<div className="bg-white h-8.5 flex items-center justify-center">
					<SwitchDatePicker
						label="Date"
						value={fromDate(date, getLocalTimeZone())}
						onChange={(value) =>
							value && onDateChange?.(value.toDate(getLocalTimeZone()))
						}
					/>
				</div>
				<div className="h-1 bg-bg-body" />
				<TableHeader table={table} layout={layout} />
			</div>
			{error ? state['error'] : rows.length ? state['data'] : state['empty']}
		</div>
	);
};

const SortIcon = (props: SVGProps<SVGSVGElement>) => {
	return (
		<svg
			width="6"
			height="8"
			viewBox="0 0 6 8"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<path d="M3 8L5.59808 5H0.401924L3 8Z" fill="#454c58"></path>
		</svg>
	);
};

interface TableHeaderProps {
	table: Table<DashboardData>;
	layout?: DashboardLayoutType;
}

const TableHeader = (props: TableHeaderProps) => {
	const { table, layout = 'row' } = props;

	const sorting = {
		asc: <SortIcon className="ml-1 rotate-180" />,
		desc: <SortIcon className="ml-1" />
	} as const;

	const renderHeaderCells =
		(id: string) => (header: Header<DashboardData, unknown>) => {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			const style = header.column.columnDef.meta?.style as
				| CSSProperties
				| undefined;

			return (
				<div
					role="columnheader"
					key={`${id}_${header.id}`}
					className={cn(
						headerCellStyles(),
						header.column.getCanSort() && 'cursor-pointer select-none'
					)}
					style={style}
					onClick={header.column.getToggleSortingHandler()}
				>
					{header.isPlaceholder
						? null
						: flexRender(header.column.columnDef.header, header.getContext())}
					{sorting[header.column.getIsSorted() as keyof typeof sorting] ?? null}
				</div>
			);
		};

	const headerGroups = table.getHeaderGroups();

	if (layout === 'row') {
		return (
			<div role="rowheader">
				{headerGroups.map((headerGroup) => (
					<div
						key={headerGroup.id}
						role="row"
						className={cn(headerRowStyles())}
					>
						{headerGroup.headers.map(renderHeaderCells('all'))}
					</div>
				))}
			</div>
		);
	}

	return (
		<div className="flex gap-1" role="rowheader">
			{headerGroups.map((headerGroup) => {
				return (
					<Fragment key={headerGroup.id}>
						<div
							key={`left_${headerGroup.id}`}
							className={cn(headerRowStyles(), 'flex-1')}
						>
							{headerGroup.headers.map(renderHeaderCells('left'))}
						</div>
						<div
							key={`right_${headerGroup.id}`}
							className={cn(headerRowStyles(), 'flex-1')}
						>
							{headerGroup.headers.map(renderHeaderCells('right'))}
						</div>
					</Fragment>
				);
			})}
		</div>
	);
};

interface TableLayoutProps {
	table: Table<DashboardData>;
	layout?: DashboardLayoutType;
	isFetching?: boolean;
	renderSubrow: DashboardTableProps['renderSubrow'];
}

const TableBody = (props: TableLayoutProps) => {
	const { table, layout = 'row', isFetching = false, renderSubrow } = props;

	const rows = table.getRowModel().rows;
	const [first, second] = splitInHalf(rows);

	const renderCells = (cell: Cell<DashboardData, unknown>) => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const style = cell.column.columnDef.meta?.style as
			| CSSProperties
			| undefined;

		return (
			<div
				key={cell.id}
				role="cell"
				className={cn(bodyCellStyles())}
				style={style}
			>
				{flexRender(cell.column.columnDef.cell, cell.getContext())}
			</div>
		);
	};

	if (layout === 'row') {
		return (
			<div
				role="rowgroup"
				className={cn(
					'flex flex-col gap-1',
					isFetching && 'pointer-events-none opacity-40'
				)}
			>
				{rows.map((row) => {
					return (
						<div
							key={row.id}
							className={bodyRowWrapperStyles({
								isExpanded: row.getIsExpanded()
							})}
						>
							<div
								className={cn(
									bodyRowStyles({
										isRowError: isRowError(row),
										isExpanded: row.getIsExpanded()
									})
								)}
							>
								{row.getVisibleCells().map(renderCells)}
							</div>
							{row.getIsExpanded() ? renderSubrow?.(row) : null}
						</div>
					);
				})}
			</div>
		);
	}

	return (
		<div
			className={cn(
				'flex gap-1',
				isFetching && 'pointer-events-none opacity-40'
			)}
		>
			<div className="flex flex-col flex-1 gap-1">
				{first.map((left) => {
					return (
						<div
							key={left.id}
							className={bodyRowWrapperStyles({
								isExpanded: left.getIsExpanded()
							})}
						>
							<div
								className={cn(
									bodyRowStyles({
										isRowError: isRowError(left),
										isExpanded: left.getIsExpanded()
									})
								)}
							>
								{left.getVisibleCells().map(renderCells)}
							</div>
							{left.getIsExpanded() ? renderSubrow?.(left) : null}
						</div>
					);
				})}
			</div>
			<div className="flex flex-col flex-1 gap-1">
				{second.map((right) => {
					return (
						<div
							key={right.id}
							className={bodyRowWrapperStyles({
								isExpanded: right.getIsExpanded()
							})}
						>
							<div
								className={cn(
									bodyRowStyles({
										isRowError: isRowError(right),
										isExpanded: right.getIsExpanded()
									})
								)}
							>
								{right.getVisibleCells().map(renderCells)}
							</div>
							{right.getIsExpanded() ? renderSubrow?.(right) : null}
						</div>
					);
				})}
			</div>
		</div>
	);
};
