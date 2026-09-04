/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import {
	Fragment,
	useEffect,
	useRef,
	useState,
	type ReactNode,
	type RefObject
} from 'react';
import {
	flexRender,
	type Row,
	type RowData,
	type Table
} from '@tanstack/react-table';

import { useDebounce } from '@/shared/hooks';
import {
	Input,
	Separator,
	TableSort,
	cn,
	type ColumnVisibilityItem
} from '@/shared/tailwind-ui';

import { useIsScrolled } from './classification-table.hooks';

declare module '@tanstack/react-table' {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface ColumnMeta<TData extends RowData, TValue> {
		width?: string;
		badgeCell?: boolean;
		className?: string;
		headerClassName?: string;
		cellClassName?: string;
	}
}

const DEFAULT_TRACK = 'minmax(0, 1fr)';
const GUTTER_TRACK = 'minmax(0, 1fr)';

/**
 * The cell that holds the gutter track open.
 *
 * Rows are `display: contents`, so every cell is a direct child of the one grid
 * and auto-placement fills straight through them. A track without a cell of its
 * own does not sit empty — it swallows the next row's first cell and every row
 * after it lands one column to the left.
 */
function GutterCell({ header = false }: { header?: boolean }) {
	return <div role={header ? 'columnheader' : 'cell'} aria-hidden />;
}

export type ClassificationTableVariant = 'card' | 'nested';

export interface ClassificationTableProps<T> {
	table: Table<T>;
	variant?: ClassificationTableVariant;
	stickyHeader?: boolean;
	/**
	 * Append an empty flexible track after the last column.
	 *
	 * Only useful for a table whose every column declares a *capped* width. The
	 * gutter takes the surplus, so a column's width no longer depends on how many
	 * other flexible tracks happen to be visible and nothing shifts when one is
	 * toggled. When the columns already overflow the container the gutter
	 * collapses to zero and the table scrolls exactly as it did before.
	 */
	endGutter?: boolean;
	scrollRef?: RefObject<HTMLElement>;
	renderSubRow?: (row: Row<T>) => ReactNode;
	getRowAttributes?: (row: Row<T>) => Record<string, string | number>;
	testId?: string;
}

export function ClassificationTable<T>({
	table,
	variant = 'card',
	stickyHeader = false,
	endGutter = false,
	scrollRef,
	renderSubRow,
	getRowAttributes,
	testId
}: ClassificationTableProps<T>) {
	const isScrolled = useIsScrolled(scrollRef);

	const tracks = table
		.getVisibleLeafColumns()
		.map((column) => column.columnDef.meta?.width ?? DEFAULT_TRACK);

	const gridTemplateColumns = (
		endGutter ? [...tracks, GUTTER_TRACK] : tracks
	).join(' ');

	return (
		<div
			className="grid w-full"
			style={{ gridTemplateColumns }}
			role="table"
			data-testid={testId}
		>
			{table.getHeaderGroups().map((headerGroup) => (
				<Fragment key={headerGroup.id}>
					<div className="contents" role="row">
						{headerGroup.headers.map((header, idx, headers) => {
							const canSort = header.column.getCanSort();

							return (
								<div
									key={header.id}
									role="columnheader"
									className={cn(
										'flex items-center h-8 px-1.5',
										variant === 'nested' ? 'bg-primary-wash' : 'bg-white',
										variant === 'nested' && idx === 0 && 'rounded-l-md',
										variant === 'nested' &&
											idx === headers.length - 1 &&
											'rounded-r-md',
										'text-left text-[0.6875rem] font-semibold leading-[0.875rem]',
										stickyHeader && 'sticky top-0 z-10',
										header.column.columnDef.meta?.badgeCell && 'pl-3',
										header.column.columnDef.meta?.className,
										header.column.columnDef.meta?.headerClassName
									)}
								>
									{header.isPlaceholder ? null : canSort ? (
										<div
											onClick={header.column.getToggleSortingHandler()}
											className={cn(
												'flex items-center gap-1 -ml-1 px-1 py-1 transition-colors rounded cursor-pointer select-none hover:bg-primary-wash',
												header.column.getIsSorted() && 'bg-primary-wash'
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
								</div>
							);
						})}
						{endGutter ? <GutterCell header /> : null}
					</div>
					{stickyHeader ? (
						<div
							aria-hidden
							className={cn(
								'sticky top-8 z-10 col-span-full h-2 -mb-2 pointer-events-none bg-gradient-to-b from-black/10 to-transparent transition-opacity',
								isScrolled ? 'opacity-100' : 'opacity-0'
							)}
						/>
					) : null}
				</Fragment>
			))}
			{table.getRowModel().rows.map((row) => (
				<ClassificationRow
					key={row.id}
					row={row}
					variant={variant}
					endGutter={endGutter}
					renderSubRow={renderSubRow}
					attributes={getRowAttributes?.(row)}
				/>
			))}
		</div>
	);
}

interface ClassificationRowProps<T> {
	row: Row<T>;
	variant: ClassificationTableVariant;
	endGutter?: boolean;
	renderSubRow?: (row: Row<T>) => ReactNode;
	attributes?: Record<string, string | number>;
}

function ClassificationRow<T>({
	row,
	variant,
	endGutter = false,
	renderSubRow,
	attributes
}: ClassificationRowProps<T>) {
	const [hovered, setHovered] = useState(false);
	const cells = row.getVisibleCells();
	const isExpanded = Boolean(renderSubRow) && row.getIsExpanded();

	return (
		<Fragment>
			<div className="contents" role="row" {...attributes}>
				{cells.map((cell, idx) => {
					const isFirst = idx === 0;
					const isLast = idx === cells.length - 1;

					return (
						<div
							key={cell.id}
							role="cell"
							onMouseEnter={() => setHovered(true)}
							onMouseLeave={() => setHovered(false)}
							className={cn(
								'mt-1 border-y border-y-transparent transition-colors',
								'text-[0.75rem] leading-[1.125rem] font-medium',
								variant === 'nested'
									? // The run's result table, cell for cell: pale rows on the
									  'px-1 py-2 bg-primary-wash flex items-start whitespace-pre-wrap overflow-wrap-anywhere'
									: 'px-1.5 py-1 min-h-[34px] flex items-center bg-white',
								isFirst &&
									'rounded-l-md border-l border-l-transparent overflow-hidden',
								isLast && 'rounded-r-md border-r border-r-transparent',
								hovered && 'border-y-primary',
								hovered && isFirst && 'border-l-primary',
								hovered && isLast && 'border-r-primary',
								isExpanded && 'border-b-transparent',
								isExpanded &&
									isFirst &&
									'rounded-bl-none [&>*]:rounded-bl-none',
								isExpanded && isLast && 'rounded-br-none',
								cell.column.columnDef.meta?.className,
								cell.column.columnDef.meta?.cellClassName
							)}
						>
							{flexRender(cell.column.columnDef.cell, cell.getContext())}
						</div>
					);
				})}
				{endGutter ? <GutterCell /> : null}
			</div>
			{isExpanded && renderSubRow ? (
				<div
					// Stops short of the gutter so the panel lines up with the card
					// above it rather than running past its right edge.
					style={{ gridColumn: endGutter ? '1 / -2' : '1 / -1' }}
					className={cn(
						'bg-white rounded-b-md border border-t-0 border-transparent transition-colors',
						hovered && 'border-primary'
					)}
					onMouseEnter={() => setHovered(true)}
					onMouseLeave={() => setHovered(false)}
				>
					{renderSubRow(row)}
				</div>
			) : null}
		</Fragment>
	);
}

export interface ClassificationToolbarProps {
	children: ReactNode;
}

export function ClassificationToolbar({
	children
}: ClassificationToolbarProps) {
	return (
		<div className="flex flex-wrap items-center gap-2 px-4 py-1.5 bg-white border-b border-border-primary shrink-0">
			{children}
		</div>
	);
}

export interface ClassificationFooterProps {
	children: ReactNode;
	isScrollable?: boolean;
}

export function ClassificationFooter({
	children,
	isScrollable = false
}: ClassificationFooterProps) {
	return (
		<div
			className={cn(
				'flex items-center gap-2 px-4 py-2 bg-white shrink-0 z-10 transition-shadow',
				isScrollable && 'shadow-sticky'
			)}
		>
			{children}
		</div>
	);
}

export interface ClassificationRangeProps {
	matchedCount: number;
	totalCount: number;
	pageIndex: number;
	pageSize: number;
	noun: string;
}

export function ClassificationRange({
	matchedCount,
	totalCount,
	pageIndex,
	pageSize,
	noun
}: ClassificationRangeProps) {
	const plural = matchedCount === 1 ? noun : `${noun}s`;

	if (!matchedCount) {
		return (
			<span className="text-xs text-text-primary tabular-nums">No {noun}s</span>
		);
	}

	const first = pageIndex * pageSize + 1;
	const last = pageIndex * pageSize + matchedCount;
	const isNarrowed = matchedCount < totalCount;

	return (
		<span className="text-xs text-text-primary tabular-nums">
			{first}–{last} of {matchedCount} {isNarrowed ? 'matching' : plural}
			{isNarrowed ? ` · ${totalCount} total` : null}
		</span>
	);
}

export interface ClassificationSearchProps {
	value: string;
	onChange: (value: string) => void;
	placeholder: string;
	testId: string;
	className?: string;
}

export function ClassificationSearch({
	value,
	onChange,
	placeholder,
	testId,
	className
}: ClassificationSearchProps) {
	const [draft, setDraft] = useState(value);
	const debounced = useDebounce(draft, 300);
	const lastPushed = useRef(value);

	useEffect(() => {
		if (debounced === lastPushed.current) return;

		lastPushed.current = debounced;
		onChange(debounced);
	}, [debounced, onChange]);

	useEffect(() => {
		if (value === lastPushed.current) return;

		lastPushed.current = value;
		setDraft(value);
	}, [value]);

	return (
		<Input
			type="text"
			placeholder={placeholder}
			className={cn('h-7 text-xs', className)}
			value={draft}
			onChange={(event) => setDraft(event.target.value)}
			data-testid={testId}
		/>
	);
}

export function ClassificationToolbarSeparator() {
	return <Separator orientation="vertical" className="h-5" />;
}

export function columnVisibilityItems<T>(
	table: Table<T>
): ColumnVisibilityItem[] {
	return table
		.getAllLeafColumns()
		.filter((column) => column.getCanHide())
		.map((column) => {
			const header = column.columnDef.header;

			return {
				id: column.id,
				label: typeof header === 'string' ? header : column.id,
				checked: column.getIsVisible()
			};
		});
}
