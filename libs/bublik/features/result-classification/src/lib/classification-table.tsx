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
	type Table,
	type VisibilityState
} from '@tanstack/react-table';

import { useDebounce, useLocalStorage } from '@/shared/hooks';
import {
	Input,
	Separator,
	TableSort,
	cn,
	type ColumnVisibilityItem
} from '@/shared/tailwind-ui';

declare module '@tanstack/react-table' {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface ColumnMeta<TData extends RowData, TValue> {
		/**
		 * This column's track in the table's grid, as a raw CSS grid track size —
		 * `'max-content'`, `'11rem'`, `'minmax(0, 1fr)'`. The whole table is one
		 * grid, so a width belongs to the column rather than to a class repeated on
		 * every cell. Omitted, the column takes `minmax(0, 1fr)` and shares the
		 * slack with the other growers.
		 *
		 * This replaced the `w-px whitespace-nowrap` idiom and the empty filler
		 * column that idiom needed: `max-content` shrinks to the contents without a
		 * neighbour to park the leftover width in.
		 */
		width?: string;
		/**
		 * A column whose cells hold badges rather than bare text. A badge carries
		 * its own `px-2` on top of the cell's, so its text starts 8px further in
		 * than a plain cell's — enough that the header above it reads as
		 * misaligned. Flagging the column pads the header to match, instead of
		 * hand-tuning a class on each one.
		 */
		badgeCell?: boolean;
		/** Applied to header and body cells alike. */
		className?: string;
		/** Applied to the header cell only. */
		headerClassName?: string;
		/** Applied to the body cells only. */
		cellClassName?: string;
	}
}

/**
 * The shared markup of every classification table.
 *
 * There is no `<table>` and no row element: the whole table is a single CSS
 * grid, and header cells and body cells are emitted flat into it. That is what
 * lets a row read as a *card* — each cell paints its own white background, the
 * end cells round the corners and close the border, and `mt-1` puts a gap
 * between one row and the next.
 *
 * Mirrors `ImportEventTable` and `HistoryLinearTable`, which is where this shape
 * comes from — keep the class strings in step with those if they change.
 *
 * Two consequences of having no row element, both load-bearing:
 *
 *  - Row hover is React state, not `group-hover:`. There is nothing to hang a
 *    group on, and every cell has to light up together.
 *  - `getRowAttributes` lands on a `display: contents` wrapper. It generates no
 *    box, so the cells stay direct grid items, but the `data-*` hooks still
 *    exist in the DOM.
 */

/** The track a column takes when it does not name one. */
const DEFAULT_TRACK = 'minmax(0, 1fr)';

/**
 * How a table is dressed.
 *
 * `card` is the standalone look: white rows on the grey page, one card per row.
 * `nested` is for a table rendered *inside* an expanded row, where the card it
 * sits in is already white — so the rows take the pale wash instead, exactly as
 * the run's own result table does. Same shape, inverted ground.
 */
export type ClassificationTableVariant = 'card' | 'nested';

export interface ClassificationTableProps<T> {
	table: Table<T>;
	/** Defaults to `card`. See `ClassificationTableVariant`. */
	variant?: ClassificationTableVariant;
	/**
	 * Pins the header row while the body scrolls. Off by default because the
	 * same component renders expanded sub-tables, which scroll with their parent
	 * and would otherwise pin a second header mid-page.
	 */
	stickyHeader?: boolean;
	/**
	 * The pane this table scrolls inside. Only used to fade in the shadow under
	 * the pinned header once there is something above the fold — without it the
	 * header floats over the first card with nothing to say it is pinned.
	 */
	scrollRef?: RefObject<HTMLElement>;
	/** Rendered in a full-width block under an expanded row. */
	renderSubRow?: (row: Row<T>) => ReactNode;
	/** Extra attributes per row, typically `data-*` hooks for e2e. */
	getRowAttributes?: (row: Row<T>) => Record<string, string | number>;
	testId?: string;
}

export function ClassificationTable<T>({
	table,
	variant = 'card',
	stickyHeader = false,
	scrollRef,
	renderSubRow,
	getRowAttributes,
	testId
}: ClassificationTableProps<T>) {
	const isScrolled = useIsScrolled(scrollRef);

	// Off the live table rather than off the column defs: these tables have
	// hideable columns, so the track list has to follow what is actually on.
	const gridTemplateColumns = table
		.getVisibleLeafColumns()
		.map((column) => column.columnDef.meta?.width ?? DEFAULT_TRACK)
		.join(' ');

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
										// 32px overall: 28px of label over 4px of white. The gap
										// under the header is padding rather than margin on
										// purpose — a margin is transparent, so with the header
										// pinned the rows would slide visibly through the slit
										// beneath it.
										'flex items-center h-8 px-2 pb-1',
										variant === 'nested'
											? 'bg-primary-wash'
											: 'bg-white',
										// Only the nested variant rounds. Its header is a band
										// floating inside a panel, so it wants ends; the card
										// variant's header is page chrome running the full width
										// of the table, and rounding it would leave two notches
										// of grey against nothing.
										variant === 'nested' && idx === 0 && 'rounded-l-md',
										variant === 'nested' &&
											idx === headers.length - 1 &&
											'rounded-r-md',
										'text-left text-[0.6875rem] font-semibold leading-[0.875rem]',
										stickyHeader && 'sticky top-0 z-10',
										// A sortable header already gains 4px from its own
										// wrapper, so it needs 4px less here to land on 16px.
										header.column.columnDef.meta?.badgeCell &&
											(canSort ? 'pl-3' : 'pl-4'),
										header.column.columnDef.meta?.className,
										header.column.columnDef.meta?.headerClassName
									)}
								>
									{header.isPlaceholder ? null : canSort ? (
										<div
											onClick={header.column.getToggleSortingHandler()}
											className={cn(
												'flex items-center gap-1 px-1 py-1 transition-colors rounded cursor-pointer select-none hover:bg-primary-wash',
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
					</div>
					{/* Pinned a header's height down and spanning every track, so one
					    shadow falls across the whole header instead of one per cell
					    drawing down the seams between them. */}
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
	renderSubRow?: (row: Row<T>) => ReactNode;
	attributes?: Record<string, string | number>;
}

/**
 * One row's cells, emitted straight into the table's grid.
 *
 * The card look is rebuilt per cell: every cell reserves a transparent 1px
 * border on all four sides — so hovering only swaps a colour and nothing shifts
 * — and the two end cells round their outer corners and close the border there.
 */
function ClassificationRow<T>({
	row,
	variant,
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
									  // white card they are nested in, top-aligned because a
									  // verdict list is several lines and its result badge
									  // belongs beside the first of them.
									  'px-1 py-2 bg-primary-wash flex items-start whitespace-pre-wrap overflow-wrap-anywhere'
									: 'px-2 py-1.5 bg-white',
								// `overflow-hidden` on the leading cell is what gives the
								// status stripe — which is `absolute inset-0` — the card's
								// rounded corner without knowing anything about it.
								isFirst &&
									'rounded-l-md border-l border-l-transparent overflow-hidden',
								isLast && 'rounded-r-md border-r border-r-transparent',
								hovered && 'border-y-primary',
								hovered && isFirst && 'border-l-primary',
								hovered && isLast && 'border-r-primary',
								// Expanded, the card continues into the panel below it, so it
								// stops rounding and stops drawing an edge between the two.
								isExpanded && 'border-b-transparent',
								isExpanded && isFirst && 'rounded-bl-none',
								isExpanded && isLast && 'rounded-br-none',
								cell.column.columnDef.meta?.className,
								cell.column.columnDef.meta?.cellClassName
							)}
						>
							{flexRender(cell.column.columnDef.cell, cell.getContext())}
						</div>
					);
				})}
			</div>
			{isExpanded && renderSubRow ? (
				<div
					className={cn(
						'col-span-full bg-white rounded-b-md border border-t-0 border-transparent transition-colors',
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

/**
 * Whether the given pane has anything scrolled above the fold.
 *
 * Only drives the header's shadow, so it is deliberately cheap: a scroll
 * listener that flips one boolean rather than tracking the offset.
 */
function useIsScrolled(scrollRef?: RefObject<HTMLElement>) {
	const [isScrolled, setIsScrolled] = useState(false);

	useEffect(() => {
		const container = scrollRef?.current;
		if (!container) return;

		function handleScroll() {
			setIsScrolled((container as HTMLElement).scrollTop > 0);
		}

		handleScroll();
		container.addEventListener('scroll', handleScroll);

		return () => container.removeEventListener('scroll', handleScroll);
	}, [scrollRef]);

	return isScrolled;
}

export interface ClassificationToolbarProps {
	children: ReactNode;
}

/** The run table's toolbar bar, minus the column controls. */
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
	/**
	 * Whether the body above is actually scrolling. Draws the shadow that says
	 * there is more table under this bar.
	 */
	isScrollable?: boolean;
}

/**
 * The toolbar's mirror, pinned under the scrolling body.
 *
 * It always renders, because the shared `Pagination` drops its navigation at a
 * single page and an empty bar would look broken — the row count keeps it
 * occupied.
 *
 * A shadow rather than a rule, and only while the body scrolls. A permanent
 * `border-t` drew the same line whether or not anything was hidden behind it,
 * which said "end of table" on a list that had ten more rows below the fold.
 * Same treatment the drawers give their sticky submit and the table gives its
 * pinned header.
 */
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
	/** Rows the table can actually render right now, after every filter. */
	matchedCount: number;
	/** What the server says the unfiltered set holds. */
	totalCount: number;
	pageIndex: number;
	pageSize: number;
	/** Singular noun — `rule`, `issue`. Pluralised here. */
	noun: string;
}

/**
 * Which rows you are looking at, in one phrase.
 *
 * `1–25 of 45 rules` rather than a bare `45 rules`, because a count alone does
 * not say where in the list you are — and the page position on the other side
 * of the bar was answering a different question with the same word ("25 of 45
 * rules" beside "1 / 1" put two meanings of *of* in one footer).
 *
 * The range counts what the table can render, not what the server holds. The
 * two differ whenever a facet is on, since filtering is still a client-side
 * pass over the page in hand — so the server's total is reported separately
 * rather than folded in, where it would claim pages that do not exist.
 */
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

/**
 * The toolbar's free-text box.
 *
 * The committed value lives in the URL, but typing must not write a query
 * param per keystroke, so the draft is local and only the debounced value is
 * pushed out. `lastPushed` is what keeps the two directions from fighting: it
 * marks the value this input is responsible for, so an external change — the
 * Reset button, a back navigation, a pasted link — is adopted into the draft
 * while our own echo is ignored.
 */
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

/**
 * Divides the toolbar into its jobs — what this table is, what you can do to
 * it, what is narrowing it — so a row of otherwise identically styled controls
 * reads as groups rather than as one undifferentiated strip.
 */
export function ClassificationToolbarSeparator() {
	return <Separator orientation="vertical" className="h-5" />;
}

/**
 * Turns a table's hideable columns into `ColumnsVisibility` items.
 *
 * Structural columns — the expander, the actions, the status stripe — opt out
 * via `enableHiding: false`, so they never appear in a menu that offers to
 * remove them.
 */
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
				// Headers are plain strings on these tables; fall back to the id for
				// anything that renders itself.
				label: typeof header === 'string' ? header : column.id,
				checked: column.getIsVisible()
			};
		});
}

/**
 * Column visibility, remembered per table.
 *
 * These tables carry ten columns or so and which ones matter is a standing
 * preference, not a per-visit one — re-hiding the same four columns on every
 * navigation is exactly the chore the control was added to remove. Scoped by
 * `tableKey` so the issues list, the rules list and a run's issues each keep
 * their own answer.
 *
 * `defaults` must be module-level: it feeds the stored snapshot's dependencies,
 * and a fresh object each render would re-read storage on every pass.
 */
export function useColumnVisibility(
	tableKey: string,
	defaults: VisibilityState
) {
	return useLocalStorage<VisibilityState>(
		`bublik.columns.${tableKey}`,
		defaults
	);
}
