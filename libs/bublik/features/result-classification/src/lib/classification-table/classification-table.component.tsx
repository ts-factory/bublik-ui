/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import {
	Fragment,
	useEffect,
	useRef,
	useState,
	type CSSProperties,
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
	Icon,
	Input,
	Separator,
	TableSort,
	cn,
	type ColumnVisibilityItem
} from '@/shared/tailwind-ui';

import { useHasScrolledPast, useIsStuck } from './classification-table.hooks';

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

/** The column header's height, and so the offset a stuck group heading sits at. */
const HEADER_HEIGHT_PX = 32;

/**
 * Where the gutter track goes: before the first visible column that is pinned
 * to the right edge, or after the last column when none of them is showing.
 */
function gutterIndex(
	visibleIds: readonly string[],
	pinnedLast: readonly string[] = []
): number {
	const idx = visibleIds.findIndex((id) => pinnedLast.includes(id));

	return idx === -1 ? visibleIds.length : idx;
}

/**
 * The cell that holds the gutter track open and carries the row's card across
 * it, so the row runs to the right edge while its columns stay packed left
 * and the columns past the gutter — Actions — sit flush with that edge.
 *
 * Rows are `display: contents`, so every cell is a direct child of the one grid
 * and auto-placement fills straight through them. A track without a cell of its
 * own does not sit empty — it swallows the next row's first cell and every row
 * after it lands one column to the left.
 */
function GutterCell({
	header = false,
	className,
	style,
	onMouseEnter,
	onMouseLeave
}: {
	header?: boolean;
	className?: string;
	style?: CSSProperties;
	onMouseEnter?: () => void;
	onMouseLeave?: () => void;
}) {
	return (
		<div
			role={header ? 'columnheader' : 'cell'}
			aria-hidden
			className={className}
			style={style}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
		/>
	);
}

export type ClassificationTableVariant = 'card' | 'nested';

export interface ClassificationTableProps<T> {
	table: Table<T>;
	variant?: ClassificationTableVariant;
	stickyHeader?: boolean;
	/**
	 * Where a sticky header pins, in px from the scroller's top. A nested
	 * table inside another's sub-row sits under that table's header, so it
	 * pins one header-height down and stacks beneath it.
	 */
	stickyTop?: number;
	/**
	 * Show a shadow under the sticky header once rows have scrolled beneath
	 * it. The grouped tables leave this off — their pinned group heading
	 * carries the shadow instead. A run's issues table has no headings, and a
	 * nested results table has none either, so their headers mark the edge
	 * themselves. An opened row's results table pins its header (same z,
	 * later in the DOM) over the outer strip and shadows itself.
	 */
	stickyShadow?: boolean;
	/**
	 * Add an empty flexible track that takes the surplus width.
	 *
	 * Only useful for a table whose every column declares a *capped* width. The
	 * gutter takes the surplus, so a column's width no longer depends on how many
	 * other flexible tracks happen to be visible and nothing shifts when one is
	 * toggled. When the columns already overflow the container the gutter
	 * collapses to zero and the table scrolls exactly as it did before.
	 *
	 * It sits after the last column unless `gutterBefore` names some.
	 */
	endGutter?: boolean;
	/**
	 * The columns that sit past the gutter, flush with the right edge — the
	 * pinned-last ones, Actions. With the gutter after them, they landed
	 * wherever the widest row ended, while the toolbar's buttons and the group
	 * headings' create buttons hugged the edge of the screen: two alignment
	 * rules on one screen. Ignored without `endGutter`.
	 */
	gutterBefore?: readonly string[];
	scrollRef?: RefObject<HTMLElement>;
	renderSubRow?: (row: Row<T>) => ReactNode;
	getRowAttributes?: (row: Row<T>) => Record<string, string | number>;
	/**
	 * What a grouped row (`row.getIsGrouped()`) shows in its full-width heading.
	 *
	 * Grouping itself is the table's: give `useReactTable` a `grouping` state,
	 * `getGroupedRowModel` and `getExpandedRowModel`, and the row model carries
	 * one grouped row per bucket followed by its leaf rows while it is expanded.
	 * Its `subRows` are the bucket's rows in the table's sort order.
	 */
	renderGroupHeader?: (row: Row<T>) => ReactNode;
	testId?: string;
}

export function ClassificationTable<T>({
	table,
	variant = 'card',
	stickyHeader = false,
	stickyTop = 0,
	stickyShadow = false,
	endGutter = false,
	gutterBefore,
	scrollRef,
	renderSubRow,
	getRowAttributes,
	renderGroupHeader,
	testId
}: ClassificationTableProps<T>) {
	const stickyStyle = stickyHeader ? { top: stickyTop } : undefined;
	// Once rows have scrolled beneath the header it shows its shadow (and a
	// nested one squares its top corners). Judged by a marker that does not
	// stick: a top-level header starts out at its pin position, so anything
	// sticky would read as pinned before the first scroll.
	const scrolledMarkerRef = useRef<HTMLDivElement>(null);
	const isHeaderStuck = useHasScrolledPast(
		scrolledMarkerRef,
		stickyHeader && stickyShadow ? scrollRef : undefined,
		stickyTop + HEADER_HEIGHT_PX
	);
	// A nested header pins flush under the outer one, so it draws a top border
	// and squares its rounded corners to read as attached. A top-level header
	// pins under the toolbar, whose own bottom border would double it.
	const marksPinnedEdge = stickyShadow && variant === 'nested';
	// Under the outermost header (z-10) and the group headings (z-9), so a
	// nested table's header slides beneath both rather than over them.
	const stickyClass =
		stickyHeader && (stickyTop ? 'sticky z-[8]' : 'sticky z-10');

	const visibleColumns = table.getVisibleLeafColumns();
	const tracks = visibleColumns.map(
		(column) => column.columnDef.meta?.width ?? DEFAULT_TRACK
	);
	// `-1`: no gutter; otherwise the index of the track it occupies.
	const gutterAt = endGutter
		? gutterIndex(
				visibleColumns.map((column) => column.id),
				gutterBefore
		  )
		: -1;

	const gridTemplateColumns = (
		gutterAt === -1
			? tracks
			: [...tracks.slice(0, gutterAt), GUTTER_TRACK, ...tracks.slice(gutterAt)]
	).join(' ');

	const headerGutter = (
		<GutterCell
			key="gutter"
			header
			style={stickyStyle}
			className={cn(
				'h-8',
				variant === 'nested' ? 'bg-primary-wash' : 'bg-white',
				stickyClass
			)}
		/>
	);

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
						{headerGroup.headers.flatMap((header, idx, headers) => {
							const canSort = header.column.getCanSort();

							return [
								...(idx === gutterAt ? [headerGutter] : []),
								<div
									key={header.id}
									role="columnheader"
									style={stickyStyle}
									className={cn(
										'flex items-center h-8 px-1.5',
										variant === 'nested' ? 'bg-primary-wash' : 'bg-white',
										variant === 'nested' && idx === 0 && 'rounded-l-md',
										variant === 'nested' &&
											idx === headers.length - 1 &&
											'rounded-r-md',
										// Always bordered, transparently, so nothing shifts; the
										// border shows once the header is pinned.
										marksPinnedEdge &&
											'border-t border-t-transparent transition-colors',
										marksPinnedEdge &&
											isHeaderStuck &&
											'border-t-border-primary',
										marksPinnedEdge &&
											isHeaderStuck &&
											idx === 0 &&
											'rounded-tl-none',
										marksPinnedEdge &&
											isHeaderStuck &&
											idx === headers.length - 1 &&
											'rounded-tr-none',
										'text-left text-[0.6875rem] font-semibold leading-[0.875rem]',
										stickyClass,
										header.column.columnDef.meta?.badgeCell && 'pl-3.5',
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
							];
						})}
						{gutterAt === headerGroup.headers.length ? headerGutter : null}
					</div>
					{stickyHeader && stickyShadow ? (
						// Eight pixels tall and pulled back up by as much, so it costs
						// the layout nothing; a zero-height box would cast no shadow.
						<div
							aria-hidden
							style={{
								top: stickyTop + HEADER_HEIGHT_PX,
								gridColumn: '1 / -1'
							}}
							className={cn(
								'sticky z-[8] h-2 -mb-2 pointer-events-none transition-opacity',
								'bg-gradient-to-b from-black/10 to-transparent',
								isHeaderStuck ? 'opacity-100' : 'opacity-0'
							)}
						/>
					) : null}
					{stickyHeader && stickyShadow ? (
						// Where the rows start, unpinned: above the header's bottom edge
						// only once they have scrolled under it.
						<div
							ref={scrolledMarkerRef}
							aria-hidden
							style={{ gridColumn: '1 / -1' }}
							className="h-0"
						/>
					) : null}
				</Fragment>
			))}
			{table.getRowModel().rows.map((row) =>
				row.getIsGrouped() ? (
					<GroupHeaderRow
						key={row.id}
						row={row}
						sticky={stickyHeader}
						scrollRef={scrollRef}
					>
						{renderGroupHeader?.(row)}
					</GroupHeaderRow>
				) : (
					<ClassificationRow
						key={row.id}
						row={row}
						variant={variant}
						gutterAt={gutterAt}
						renderSubRow={renderSubRow}
						attributes={getRowAttributes?.(row)}
					/>
				)
			)}
		</div>
	);
}

interface GroupHeaderRowProps<T> {
	row: Row<T>;
	sticky: boolean;
	scrollRef?: RefObject<HTMLElement>;
	children: ReactNode;
}

/**
 * A grouped row's heading, spanning every track, gutter included. It sits
 * under the sticky column header while its rows scroll past — picking up a
 * shadow and squaring its top corners once it is pinned there, so it reads as
 * part of the header rather than a card that happens to be at the top — and
 * folds its rows away on request: a long "all projects" page is easier to
 * read one project at a time.
 */
function GroupHeaderRow<T>({
	row,
	sticky,
	scrollRef,
	children
}: GroupHeaderRowProps<T>) {
	const ref = useRef<HTMLDivElement>(null);
	const isExpanded = row.getIsExpanded();
	const toggle = row.getToggleExpandedHandler();
	const isStuck = useIsStuck(
		ref,
		sticky ? scrollRef : undefined,
		HEADER_HEIGHT_PX
	);

	return (
		<div
			ref={ref}
			role="row"
			aria-level={row.depth + 1}
			style={{ gridColumn: '1 / -1' }}
			// The whole heading folds the group, not just the chevron — a bigger
			// target, and what a reader tries first. Controls inside it (the
			// create button) stop the click on their way up.
			onClick={toggle}
			className={cn(
				// `pl-0.5`: the 20px toggle then centres 12px in, over the stripe
				// icon of the rows beneath (a 24px track), and the name that follows
				// starts where their first column does. `pr-1.5`, the cells' own
				// inset, so the create button ends where the Actions column does.
				'flex items-center gap-2 mt-1 pl-0.5 pr-1.5 py-1.5 min-h-[34px] rounded-md bg-white',
				'cursor-pointer select-none transition-colors hover:bg-primary-wash',
				'text-[0.75rem] leading-[1.125rem] font-semibold text-text-primary',
				// The top border is always there so nothing shifts when it shows;
				// it only takes colour once the heading is pinned under the header.
				'border-t border-t-transparent transition-[box-shadow,border-radius,border-color]',
				sticky && 'sticky top-8 z-[9]',
				isStuck &&
					'rounded-t-none border-t-border-primary shadow-[0_6px_8px_-6px_rgba(0,0,0,0.25)]'
			)}
			data-testid="classification-group"
			data-group-key={String(row.groupingValue)}
			data-expanded={isExpanded ? 'true' : 'false'}
			data-stuck={isStuck ? 'true' : undefined}
		>
			<button
				type="button"
				aria-label={isExpanded ? 'Hide these rows' : 'Show these rows'}
				aria-expanded={isExpanded}
				onClick={(event) => {
					event.stopPropagation();
					toggle();
				}}
				className="grid transition-colors rounded size-5 shrink-0 place-items-center text-text-primary hover:bg-primary-wash hover:text-primary"
				data-testid="classification-group-toggle"
			>
				<Icon
					name="ArrowShortTop"
					size={16}
					className={cn(
						'transition-transform',
						isExpanded ? 'rotate-180' : 'rotate-90'
					)}
				/>
			</button>
			{children}
		</div>
	);
}

interface ClassificationRowProps<T> {
	row: Row<T>;
	variant: ClassificationTableVariant;
	/** The index of the gutter track among the row's cells; `-1` for none. */
	gutterAt?: number;
	renderSubRow?: (row: Row<T>) => ReactNode;
	attributes?: Record<string, string | number>;
}

function ClassificationRow<T>({
	row,
	variant,
	gutterAt = -1,
	renderSubRow,
	attributes
}: ClassificationRowProps<T>) {
	const [hovered, setHovered] = useState(false);
	const cells = row.getVisibleCells();
	const isExpanded = Boolean(renderSubRow) && row.getIsExpanded();
	const gutterIsLast = gutterAt === cells.length;

	// The card's edge treatment. The card runs across the gutter — it takes the
	// same background and hover border as the cells either side of it — and
	// whichever cell comes last closes it on the right.
	const cellClassName = (isFirst: boolean, isLast: boolean) =>
		cn(
			'mt-1 border-y border-y-transparent transition-colors',
			'text-[0.75rem] leading-[1.125rem] font-medium',
			variant === 'nested'
				? // The run's result table, cell for cell: pale rows on the
				  'px-1 py-2 bg-primary-wash flex items-start whitespace-pre-wrap overflow-wrap-anywhere'
				: 'px-1.5 py-1 min-h-[34px] flex items-center bg-white',
			isFirst && 'rounded-l-md border-l border-l-transparent overflow-hidden',
			isLast && 'rounded-r-md border-r border-r-transparent',
			hovered && 'border-y-primary',
			hovered && isFirst && 'border-l-primary',
			hovered && isLast && 'border-r-primary',
			isExpanded && 'border-b-transparent',
			isExpanded && isFirst && 'rounded-bl-none [&>*]:rounded-bl-none',
			isExpanded && isLast && 'rounded-br-none'
		);

	const gutter = (
		<GutterCell
			key="gutter"
			className={cellClassName(false, gutterIsLast)}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
		/>
	);

	return (
		<Fragment>
			<div className="contents" role="row" {...attributes}>
				{cells.flatMap((cell, idx) => {
					const isFirst = idx === 0;
					const isLast = idx === cells.length - 1 && !gutterIsLast;

					return [
						...(idx === gutterAt ? [gutter] : []),
						<div
							key={cell.id}
							role="cell"
							onMouseEnter={() => setHovered(true)}
							onMouseLeave={() => setHovered(false)}
							className={cn(
								cellClassName(isFirst, isLast),
								cell.column.columnDef.meta?.className,
								cell.column.columnDef.meta?.cellClassName
							)}
						>
							{flexRender(cell.column.columnDef.cell, cell.getContext())}
						</div>
					];
				})}
				{gutterIsLast ? gutter : null}
			</div>
			{isExpanded && renderSubRow ? (
				<div
					style={{ gridColumn: '1 / -1' }}
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
		<div
			className={cn(
				'flex flex-wrap items-center gap-2 px-4 py-[3px] min-h-9 bg-white rounded-t border-b border-border-primary shrink-0',
				// Every button in the bar — the filters, Reset, Columns, New — is
				// as tall as the search field beside them, not the 26px `xss`
				// cap they are drawn at elsewhere. Not the buttons inside them:
				// a badge chip in a filter is a button too, as Radix's tooltip
				// trigger hands it a click handler.
				'[&_button:not(button_button)]:h-7 [&_button:not(button_button)]:max-h-7'
			)}
		>
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
				'flex items-center gap-2 px-4 py-2 bg-white rounded-b shrink-0 z-10 transition-shadow',
				isScrollable && 'shadow-sticky'
			)}
		>
			{children}
		</div>
	);
}

export interface ClassificationRangeProps {
	/** Rows that match the filters, across every page. */
	matchedCount: number;
	/** Rows before the client-side filters; defaults to `matchedCount`. */
	totalCount?: number;
	pageIndex: number;
	pageSize: number;
	noun: string;
}

export function ClassificationRange({
	matchedCount,
	totalCount = matchedCount,
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
	const last = Math.min((pageIndex + 1) * pageSize, matchedCount);
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

/**
 * The column picker's rows, in the table's own left-to-right order so the list
 * reads top-to-bottom the way the table reads across. Columns that cannot be
 * hidden — the stripe, the expander, Actions — are pinned in place and left
 * out, so nothing in the list can be dragged somewhere the table would refuse.
 */
export function columnPickerItems<T>(
	table: Table<T>,
	columnOrder: readonly string[]
): ColumnVisibilityItem[] {
	// The order can name columns this table does not have right now — the rules
	// table keeps its expander in the order but only defines it when compact.
	// `table.getColumn` logs an error for those in development, so look them up
	// among the table's own columns and skip the rest quietly.
	const columns = new Map(
		table.getAllLeafColumns().map((column) => [column.id, column])
	);

	return columnOrder.flatMap((id) => {
		const column = columns.get(id);
		if (!column || !column.getCanHide()) return [];

		const header = column.columnDef.header;

		return [
			{
				id: column.id,
				label: typeof header === 'string' ? header : column.id,
				checked: column.getIsVisible()
			}
		];
	});
}
