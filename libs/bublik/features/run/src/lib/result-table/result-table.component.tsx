/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	CSSProperties,
	Fragment,
	MouseEvent as ReactMouseEvent,
	ReactNode,
	RefObject,
	memo,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState
} from 'react';
import {
	ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	OnChangeFn,
	PaginationState,
	Row,
	Updater,
	useReactTable
} from '@tanstack/react-table';
import { createNextState } from '@reduxjs/toolkit';
import { QueryParamConfig, useQueryParam, withDefault } from '@/router';

import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import { useIsSticky, useMount } from '@/shared/hooks';
import {
	type IssueCategory,
	type IssueResultsFacets,
	RESULT_PROPERTIES,
	RESULT_TYPE,
	RunDataResults
} from '@/shared/types';
import { config } from '@/bublik/config';
import {
	cn,
	Skeleton,
	TwTableProps,
	Badge,
	BadgeVariants,
	Icon,
	Separator,
	Tooltip
} from '@/shared/tailwind-ui';
import {
	formatKeyValueForDisplay,
	toSingleLineParameterLabel
} from '@/shared/utils';
import {
	BASELINE_TOGGLE,
	CATEGORY_ORDER,
	CategoryBadge,
	RESULT_CLASSIFICATION_META,
	RESULT_CLASSIFICATION_ORDER,
	type ResultClassification,
	ResultClassificationBadge,
	buildFacetOptions,
	categoryMeta,
	isClassifiable,
	resultClassification,
	useResultSelection,
	withFacetBadges
} from '@/bublik/features/result-classification';
import { BublikEmptyState, BublikErrorState } from '@/bublik/features/ui-state';
import {
	decodeCompressedOrJsonState,
	encodeCompressedState,
	isCompressedStateValue
} from '@/bublik/features/sidebar';

import { getColumns } from './result-table.columns';
import { ResultTableFilters } from './result-table-filters.component';
import {
	COLUMN_ID,
	ObtainedResultFilterSchema,
	obtainedResultFilterCount,
	StringArraySchema
} from './constants';
import { useTargetIterationId } from '../run-table/run-table.hooks';
import { RowState, useGlobalRequirements } from '../hooks';

/** The run table's own sticky header, which this table's header pins under. */
const HEADER_HEIGHT = 102;
/** Height of the filter row the table's header pins under. */
export const TOOLBAR_HEIGHT = 36;
const RESULT_PROPERTIES_LABEL: Record<RESULT_PROPERTIES, string> = {
	[RESULT_PROPERTIES.Expected]: 'Expected',
	[RESULT_PROPERTIES.Unexpected]: 'Unexpected',
	[RESULT_PROPERTIES.NotRun]: 'Not Run'
};

/**
 * The colour a result property carries in the cells: a result is green when
 * it is what was expected and red when it is not, so the filter that picks
 * by expectation shows the same two.
 */
const RESULT_PROPERTIES_BADGE_VARIANT: Record<
	RESULT_PROPERTIES,
	BadgeVariants
> = {
	[RESULT_PROPERTIES.Expected]: BadgeVariants.Expected,
	[RESULT_PROPERTIES.Unexpected]: BadgeVariants.Unexpected,
	[RESULT_PROPERTIES.NotRun]: BadgeVariants.Neutral
};

/**
 * A highlighted row in the filter's list inks its text primary, and a badge
 * with no colour of its own would take it. The coloured variants carry
 * theirs; the plain chips are told to keep the body colour.
 */
const FACET_CHIP_CLASS = 'text-text-primary';

/**
 * Facet options drawn as the badges their column's cells draw, so every filter
 * in the bar reads in the vocabulary of what it filters: Category and
 * Classification already did, through `withFacetBadges`; this does the same
 * for the open-vocabulary facets, which carry no count to put in `detail`.
 * The label stays, so the search still finds an option by its words.
 */
function withBadges<O extends { label: string; value: string }>(
	options: O[],
	badgeFor: (option: O) => ReactNode
): (O & { render: ReactNode })[] {
	return options.map((option) => ({ ...option, render: badgeFor(option) }));
}

export interface SkeletonProps {
	rowCount?: number;
}

export const ResultTableLoading = ({ rowCount = 25 }: SkeletonProps) => {
	return (
		<div className="flex flex-col gap-1 mt-1 mb-1">
			<Skeleton className="rounded-b h-[38px]" />
			{Array(rowCount)
				.fill(1)
				.map((_, idx) => (
					<Skeleton key={idx} className="h-[110px] rounded" />
				))}
		</div>
	);
};

export interface ResultTableErrorProps {
	error: unknown;
}

export const ResultTableError = ({ error }: ResultTableErrorProps) => {
	return <BublikErrorState error={error} />;
};

export const ResultTableEmpty = () => {
	return (
		<BublikEmptyState
			title="No data"
			description="No result table data available"
		/>
	);
};

export interface ResultTablePagingInfo {
	/** Rows that pass the filters, across every page. */
	matchedCount: number;
	pageCount: number;
}

export interface ResultTableProps {
	rowId: string;
	data: RunDataResults[];
	showLinkToRun?: boolean;
	/** Lead with a Test column; for rows that span tests and runs. */
	showTest?: boolean;
	/**
	 * The height of the run table row this table hangs under; the header
	 * pins below it and the run table's own header.
	 */
	height: number;
	/**
	 * Where the header pins instead, in px from the top of the scroller, when
	 * the table is not under the run table at all.
	 */
	stickyTop?: number;
	/**
	 * The scroller the header pins inside, when it is not the page: the
	 * header's shadow is judged against it.
	 */
	scrollRef?: RefObject<HTMLElement>;
	/**
	 * Where the filters live. `inline` draws them in a bar pinned above the
	 * header, always shown. `external` leaves it out, for a host that renders
	 * `ResultTableToolbar` itself, beside its own heading.
	 */
	toolbar?: 'inline' | 'external';
	/**
	 * Drawn at the end of the inline bar, after a separator: the run page's
	 * History link.
	 */
	toolbarTrailing?: ReactNode;
	/**
	 * Added to the inline bar. The run page gives it the table's side borders;
	 * a host whose row above the bar draws no bottom edge gives it a top one,
	 * which stays when the bar pins under that row.
	 */
	toolbarClassName?: string;
	/**
	 * Page the filtered rows client-side. Absent under the run table, where
	 * one test's results in one run are shown whole; the host owns the state
	 * so it can keep it in the URL.
	 */
	pagination?: PaginationState;
	onPaginationChange?: OnChangeFn<PaginationState>;
	/**
	 * Told the counts a pager needs whenever they change, so the host can
	 * draw its footer outside the table, pinned under the scroller.
	 */
	onPagingInfoChange?: (info: ResultTablePagingInfo) => void;
	/**
	 * The rows arrive already narrowed, by a server reading the same filter
	 * state: the table keeps the state, so chips still light up, but filters
	 * nothing itself. Goes with `pageCount`, the server's page count.
	 */
	manualFiltering?: boolean;
	pageCount?: number;
	targetIterationId?: number;
	rowState?: RowState;
	onRowClick?: (row: Row<RunDataResults>) => void;
	path?: string;
	/** Refetching rows already shown: they stay, dimmed, until the new ones land. */
	isFetching?: boolean;
}

export const ResultTable = memo((props: ResultTableProps) => {
	const {
		data = [],
		rowId,
		showLinkToRun = false,
		showTest = false,
		height,
		stickyTop = height + HEADER_HEIGHT,
		scrollRef,
		toolbar = 'inline',
		toolbarTrailing,
		toolbarClassName,
		pagination,
		onPaginationChange,
		onPagingInfoChange,
		manualFiltering = false,
		pageCount: manualPageCount,
		targetIterationId,
		rowState,
		onRowClick,
		path,
		isFetching = false
	} = props;
	const { columnFilters, setColumnFilters } = useColumnFilters(rowId);
	const filters = useDataTableFilters(rowId, data);
	const hasBar = toolbar === 'inline';
	// The header pins under the bar, when the table draws one.
	const headerTop = stickyTop + (hasBar ? TOOLBAR_HEIGHT : 0);

	const columns = useMemo(
		() => getColumns({ rowId, showLinkToRun, showTest, data, path }),
		[rowId, showLinkToRun, showTest, data, path]
	);

	const { stickyOffset } = useStickyHeader({ stickyTop: headerTop });

	const table = useReactTable<RunDataResults>({
		data,
		getRowId: (row) => String(row.result_id),
		columns,
		manualFiltering,
		// Paged by the server: one page arrives, and it is shown whole.
		manualPagination: !pagination || manualFiltering,
		pageCount: manualFiltering ? manualPageCount : undefined,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel:
			pagination && !manualFiltering ? getPaginationRowModel() : undefined,
		enableSorting: false,
		state: { columnFilters, ...(pagination ? { pagination } : {}) },
		onColumnFiltersChange: setColumnFilters,
		onPaginationChange,
		// The page lives with the host; TanStack's own reset fires whenever a
		// row model recomputes, which a filter change does, and would undo a
		// page change the host just made.
		autoResetPageIndex: false
	});

	const matchedCount = table.getFilteredRowModel().rows.length;
	const pageCount = table.getPageCount();
	const rows = table.getRowModel().rows;
	const selectable = useMemo(() => rows.map((row) => row.original), [rows]);

	useEffect(() => {
		onPagingInfoChange?.({ matchedCount, pageCount });
	}, [onPagingInfoChange, matchedCount, pageCount]);

	// A filter that narrows the rows can leave the page past the end.
	useEffect(() => {
		if (!pagination || !onPaginationChange) return;
		if (pageCount > 0 && pagination.pageIndex >= pageCount) {
			onPaginationChange((prev) => ({ ...prev, pageIndex: pageCount - 1 }));
		}
	}, [pagination, onPaginationChange, pageCount]);

	const gridTemplateColumns = columns
		.map((col) => col.meta?.['width'] || 'minmax(0, 1fr)')
		.join(' ');

	const headerRef = useRef<HTMLDivElement | null>(null);
	const { isSticky } = useIsSticky(headerRef, {
		offset: stickyOffset,
		rootRef: scrollRef
	});

	// A header pinned below the top of its scroller sits under another
	// table's row or header: the edge that separated them scrolls away
	// beneath it, so it draws that edge itself once it is stuck. One pinned
	// under the bar has the bar's bottom border above it, which a border of
	// its own would double; what the bar needs above itself is the host's
	// call (`toolbarClassName`), since some rows it pins under draw the edge.
	const marksPinnedEdge = !hasBar && stickyTop > 0;

	return (
		<div className={cn(isFetching && 'opacity-40 pointer-events-none')}>
			{hasBar ? (
				// Bordered, not shadowed: the header pinned right under it is the
				// bottom of the sticky stack and casts the one shadow onto the rows.
				<div
					className={cn(
						'toolbar-container sticky z-10 flex h-9 items-center gap-2 border-b border-border-primary bg-bg-primary pl-5 pr-4',
						toolbarClassName
					)}
					style={{ top: stickyTop }}
					data-testid="result-table-toolbar"
				>
					<ResultTableFilters
						filters={filters}
						selectable={selectable}
						className="min-w-0 flex-1"
					/>
					{toolbarTrailing ? (
						<>
							<Separator orientation="vertical" className="h-5" />
							<div className="flex shrink-0 items-center gap-2">
								{toolbarTrailing}
							</div>
						</>
					) : null}
				</div>
			) : null}
			<div className="px-4 pb-2">
				<div className="grid relative z-[5]" style={{ gridTemplateColumns }}>
					{table.getHeaderGroups().map((headerGroup) => (
						<Fragment key={headerGroup.id}>
							{headerGroup.headers.map((header, idx, headers) => {
								const className = header.column.columnDef.meta?.['className'];
								const headerCellClassName =
									header.column.columnDef.meta?.['headerCellClassName'];

								return (
									<div
										key={header.id}
										className={cn(
											'px-1 text-left text-[0.6875rem] font-semibold leading-[0.875rem] z-20',
											// The 32px the classification tables' headers take; the
											// Filters toggle in the Requirements header fits inside.
											'h-8 py-0',
											'bg-primary-wash sticky',
											'flex items-center',
											// Pinned under another table's row or header, the edge that
											// separated them scrolls away beneath it, so the header draws
											// that edge itself once it is stuck. Always bordered,
											// transparently, so nothing shifts when it shows.
											marksPinnedEdge &&
												'border-t border-t-transparent transition-colors',
											marksPinnedEdge && isSticky && 'border-t-border-primary',
											idx === 0 && 'rounded-bl-md',
											idx === headers.length - 1 && 'rounded-br-md',
											'mb-1',
											className,
											headerCellClassName
										)}
										style={{
											top: headerTop,
											boxShadow: isSticky
												? `var(--shadow-color) ${idx === 0 ? 0 : 7}px 2px 10px`
												: 'none'
										}}
										ref={(el) => {
											if (idx === 0) {
												headerRef.current = el;
											}
										}}
									>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext()
											  )}
									</div>
								);
							})}
						</Fragment>
					))}

					{rows.map((row, idx, arr) => (
						<ResultRow
							key={row.id}
							row={row}
							idx={idx}
							arr={arr}
							targetIterationId={targetIterationId}
							rowState={rowState}
							onRowClick={onRowClick}
							headerBottom={headerTop + HEADER_ROW_HEIGHT}
							scrollRef={scrollRef}
						/>
					))}
				</div>
			</div>
		</div>
	);
});

export interface ResultTableToolbarProps {
	/** The same key the table was given: the filters are stored under it. */
	rowId: string;
	data: RunDataResults[];
	/** What the filters offer, when a server knows more rows than `data` holds. */
	facets?: ResultTableFacets;
	/** The rows the table shows, for Select All; left out, it is not drawn. */
	results?: readonly RunDataResults[];
	className?: string;
}

/**
 * The result table's filters, for a host rendering them beside its own
 * heading rather than in the table's inline bar. Reads and writes the same
 * URL state as the table with this `rowId`, so it must sit under the same
 * `GlobalRequirementsProvider`.
 */
export function ResultTableToolbar({
	rowId,
	data,
	facets,
	results,
	className
}: ResultTableToolbarProps) {
	const filters = useDataTableFilters(rowId, data, facets);

	return (
		<ResultTableFilters
			filters={filters}
			selectable={results}
			className={className}
		/>
	);
}

/**
 * The filter bar's state for a host that answers it itself - a server
 * narrowing the rows by the same selections. The `*Filter` fields are what
 * is selected; the option lists are what the chips offer.
 */
export const useResultTableFilters = useDataTableFilters;

/** The values every filter can take, as a server reports them. */
export type ResultTableFacets = IssueResultsFacets;

interface ResultRowProps {
	row: Row<RunDataResults>;
	idx: number;
	arr: Row<RunDataResults>[];
	targetIterationId?: number;
	rowState?: RowState;
	onRowClick?: (row: Row<RunDataResults>) => void;
	/** Where the pinned header ends, in px from the top of the scroller. */
	headerBottom: number;
	scrollRef?: RefObject<HTMLElement>;
}

function ResultRow(props: ResultRowProps) {
	const {
		row,
		idx,
		arr,
		targetIterationId,
		rowState,
		onRowClick,
		headerBottom,
		scrollRef
	} = props;
	const firstCellRef = useRef<HTMLDivElement>(null);
	const topEdgeRef = useRef<HTMLSpanElement>(null);
	// The first row's corner marks reach up over the header's empty bottom
	// edge, so they are drawn above it while the row sits below it, and under
	// it once the row scrolls beneath, as the rest of the row is.
	const isBelowHeader = useIsBelowLine(topEdgeRef, headerBottom, {
		enabled: idx === 0,
		rootRef: scrollRef
	});
	const marksOverHeader = idx === 0 && isBelowHeader;
	const isTarget = row.original.result_id === targetIterationId;
	// Under a selection the click picks the row, and the reference row is the
	// one set as reference, from the row's hover button or the selection
	// popover; elsewhere the click sets the reference row itself, as it always
	// did, and so does the hover button.
	const selection = useResultSelection();
	const isSelected = selection?.isSelected(row.original.result_id) ?? false;
	// A plain pass cannot be classified, so it is not picked either; it can
	// still be the reference, from its hover button. One picked before that
	// rule can still be dropped.
	const isPickable = !selection || isSelected || isClassifiable(row.original);
	const isReferenceDiffRow = selection
		? selection.referenceResultId === row.original.result_id
		: rowState?.referenceDiffRowId === row.id;
	const toggleReference = selection
		? () =>
				selection.setReference(
					isReferenceDiffRow ? null : row.original.result_id
				)
		: onRowClick
		? () => onRowClick(row)
		: undefined;
	const { setTargetIterationId } = useTargetIterationId();
	const INTERACTIVE_SELECTOR =
		'button, a, input, select, textarea, [role="button"], [data-stop-row-click="true"]';

	useMount(() => {
		if (!isTarget) return;
		firstCellRef.current?.scrollIntoView({
			behavior: 'smooth',
			block: 'center'
		});
		setTimeout(() => setTargetIterationId(null), 5000);
	});

	const [hovered, setHovered] = useState(false);

	function handleRowClick(event: ReactMouseEvent<HTMLDivElement>) {
		const target = event.target as HTMLElement;
		const interactiveParent = target.closest(INTERACTIVE_SELECTOR);

		if (interactiveParent) return;

		if (selection) {
			if (isPickable) selection.toggle(row.original);
			return;
		}

		onRowClick?.(row);
	}

	return (
		<Fragment>
			{row.getVisibleCells().map((cell, cellIdx, cellArr) => {
				// The baseline toggle sits over the parameters it dims; without
				// that column, at the row's end.
				const hasParameters = cellArr.some(
					(c) => c.column.id === COLUMN_ID.PARAMETERS
				);
				const className = cell.column.columnDef.meta?.['className'];
				const isFirstCell = cellIdx === 0;
				const isLastCell = cellIdx === cellArr.length - 1;
				const holdsToggle = hasParameters
					? cell.column.id === COLUMN_ID.PARAMETERS
					: isLastCell;

				return (
					<div
						key={cell.id}
						data-column-id={cell.column.id}
						// The cells of one result are siblings, with no row box
						// around them: this is what groups them for a reader of
						// the DOM, as the column id tells the cells of a row apart.
						data-result-id={row.original.result_id}
						data-selected={isSelected ? '' : undefined}
						data-selectable={selection && isPickable ? '' : undefined}
						onMouseEnter={() => setHovered(true)}
						onMouseLeave={() => setHovered(false)}
						className={cn(
							// The top padding makes room for the corner marks' lower half.
							'px-1 pt-3 pb-2 bg-bg-primary text-text-primary text-[0.75rem] leading-[1.125rem] font-medium',
							'flex items-start whitespace-pre-wrap',
							// The row's corner marks hang off its first and last cells.
							(isFirstCell || holdsToggle) && 'relative',
							'bg-primary-wash transition-colors',
							// A picked row and the reference row are both outlined; the
							// picked one is tinted too, so it still reads when it is both.
							isReferenceDiffRow || isSelected
								? 'border-y border-primary'
								: 'border-y border-y-transparent',
							idx !== arr.length - 1 && 'mb-1',
							cellIdx === 0 &&
								(isReferenceDiffRow || isSelected
									? 'rounded-l-md border-l border-primary'
									: 'rounded-l-md border-l border-l-transparent'),
							cellIdx === cellArr.length - 1 &&
								(isReferenceDiffRow || isSelected
									? 'rounded-r-md border-r border-primary'
									: 'rounded-r-md border-r border-r-transparent'),
							className,
							isSelected && 'bg-primary/10',
							isTarget && 'animate-border-pulse',
							!isReferenceDiffRow &&
								!isSelected &&
								isPickable &&
								hovered &&
								'border-y-primary border-l-primary border-r-primary'
						)}
						style={{
							overflowWrap: 'anywhere',
							cursor: (selection ? isPickable : onRowClick)
								? 'pointer'
								: 'default'
						}}
						ref={cellIdx === 0 ? firstCellRef : undefined}
						onClick={handleRowClick}
					>
						{flexRender(cell.column.columnDef.cell, cell.getContext())}
						{isFirstCell && idx === 0 ? (
							<span
								ref={topEdgeRef}
								aria-hidden
								className="pointer-events-none absolute inset-x-0 top-0 h-px"
							/>
						) : null}
						{isFirstCell && isReferenceDiffRow ? (
							<ReferenceRowBadge overHeader={marksOverHeader} />
						) : null}
						{holdsToggle && hovered && toggleReference ? (
							<ReferenceRowButton
								isReference={isReferenceDiffRow}
								onClick={toggleReference}
								overHeader={marksOverHeader}
								align={hasParameters ? 'start' : 'end'}
							/>
						) : null}
					</div>
				);
			})}
		</Fragment>
	);
}

/** The height of the header row, `h-8`. */
const HEADER_ROW_HEIGHT = 32;

/**
 * Whether the element's top is below `line`, in px from the top of the root
 * (the scroller, or the viewport): for an element pinned there, whether
 * this one has yet to pass beneath it. Watch a 1px edge, as a taller element
 * would be judged by its visible part.
 */
function useIsBelowLine(
	ref: RefObject<HTMLElement>,
	line: number,
	{ enabled, rootRef }: { enabled: boolean; rootRef?: RefObject<Element> }
): boolean {
	const [isBelow, setIsBelow] = useState(true);

	useEffect(() => {
		const el = ref.current;

		if (!enabled || !el) return;

		const observer = new IntersectionObserver(
			([entry]) =>
				setIsBelow(
					entry.isIntersecting ||
						// Out of sight below the root's bottom is below the line too.
						entry.boundingClientRect.top >
							(entry.rootBounds?.bottom ?? Number.POSITIVE_INFINITY)
				),
			{
				root: rootRef?.current ?? null,
				rootMargin: `${-line}px 0px 0px 0px`,
				threshold: [0]
			}
		);

		observer.observe(el);
		return () => observer.disconnect();
	}, [ref, line, enabled, rootRef]);

	return isBelow;
}

/**
 * Where a row's corner marks sit: centred on its top border, so the upper
 * half lies in the gap and the row above's bottom padding, or on the first
 * row the header's empty bottom edge, and the lower half in the cell's top
 * padding, clear of the text on both sides. Drawn as the history form's
 * verdict lookup switch is: a bordered tray holding small uppercase chips.
 */
// `w-max` and `whitespace-nowrap`: an absolute box is otherwise as wide as
// its cell lets it be, and the first cell is narrow.
const ROW_CORNER_CLASS =
	'absolute -top-3 inline-flex h-[1.375rem] w-max items-center gap-1 whitespace-nowrap rounded border border-border-primary bg-bg-primary p-0.5';

/** Above the header (`z-20`) while the row is below it, under it once not. */
function rowCornerLayer(overHeader: boolean): string {
	return overHeader ? 'z-[21]' : 'z-[1]';
}

const ROW_CORNER_CHIP_CLASS =
	'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.02em] leading-[0.75rem] transition-colors';

/**
 * Marks the row the other rows' parameters are compared against, and says
 * what that does, since the dimming is otherwise the only sign of it.
 */
function ReferenceRowBadge({ overHeader }: { overHeader: boolean }) {
	return (
		<span
			// In line with the first cell's content, past the row's rounded corner.
			className={cn(
				ROW_CORNER_CLASS,
				rowCornerLayer(overHeader),
				'left-[26px]'
			)}
			data-testid="result-reference-badge"
		>
			<span
				className={cn(ROW_CORNER_CHIP_CLASS, 'bg-badge-0 text-text-primary')}
			>
				Baseline
			</span>
			<span className="pr-1 text-[0.6875rem] font-medium leading-none text-text-menu">
				Parameters that match it are dimmed
			</span>
		</span>
	);
}

interface ReferenceRowButtonProps {
	isReference: boolean;
	onClick: () => void;
	overHeader: boolean;
	/** `start` lines it up with the cell's content, `end` with the row's end. */
	align: 'start' | 'end';
}

/** Shown while the row is hovered: makes it the baseline, or clears it. */
function ReferenceRowButton({
	isReference,
	onClick,
	overHeader,
	align
}: ReferenceRowButtonProps) {
	const baseline = isReference ? BASELINE_TOGGLE.clear : BASELINE_TOGGLE.set;

	return (
		<Tooltip content={baseline.hint} disableHoverableContent>
			<button
				type="button"
				className={cn(
					ROW_CORNER_CLASS,
					rowCornerLayer(overHeader),
					align === 'start' ? 'left-1' : 'right-2',
					'group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20'
				)}
				onClick={(event) => {
					event.stopPropagation();
					onClick();
				}}
				data-testid="result-reference-toggle"
				data-state={isReference ? 'on' : 'off'}
			>
				<span
					className={cn(
						ROW_CORNER_CHIP_CLASS,
						'text-text-menu group-hover:bg-primary-wash group-hover:text-primary'
					)}
				>
					<Icon name="SwapArrows" size={12} className="rotate-90" />
					{baseline.label}
				</span>
			</button>
		</Tooltip>
	);
}

interface StickyHeaderOptions {
	stickyTop: number;
}

function useStickyHeader({ stickyTop }: StickyHeaderOptions) {
	// Sticky offset is used for the useIsSticky hook to detect when header becomes sticky
	// Now that toolbar is below header, offset doesn't depend on toolbar visibility
	const stickyOffset = -(stickyTop + 1);

	const getHeaderProps = useCallback<
		NonNullable<TwTableProps<RunDataResults>['getHeaderProps']>
	>(
		(_, { isSticky }) => {
			return {
				style: {
					top: `${stickyTop}px`,
					position: 'sticky',
					boxShadow: isSticky ? '0 0 10px var(--shadow-color)' : 'none'
				} as CSSProperties
			};
		},
		[stickyTop]
	);

	return { stickyOffset, getHeaderProps };
}

export function useDataTableFilters(
	rowId: string,
	data: RunDataResults[],
	// With facets the option lists come from them, whole; without, from the
	// rows, narrowed by the other filters as the run page does it.
	facets?: ResultTableFacets
) {
	const { columnFilters, setColumnFilters, resetLocalRequirements } =
		useColumnFilters(rowId);
	const { setLocalRequirements } = useGlobalRequirements();
	const resultValues = new Set(Object.values(RESULT_TYPE));
	const resultPropertiesValues = new Set<RESULT_PROPERTIES>([
		RESULT_PROPERTIES.Expected,
		RESULT_PROPERTIES.Unexpected,
		RESULT_PROPERTIES.NotRun
	]);

	const requirementsFilter = useMemo(() => {
		return (columnFilters.find((filter) => filter.id === COLUMN_ID.REQUIREMENTS)
			?.value ?? []) as string[];
	}, [columnFilters]);

	const parametersFilter = useMemo(() => {
		return (columnFilters.find((filter) => filter.id === COLUMN_ID.PARAMETERS)
			?.value ?? []) as string[];
	}, [columnFilters]);

	const obtainedResultFilter = useMemo(() => {
		return ObtainedResultFilterSchema.parse(
			columnFilters.find((filter) => filter.id === COLUMN_ID.OBTAINED_RESULT)
				?.value
		);
	}, [columnFilters]);

	const verdictsFilter = obtainedResultFilter.verdicts;
	const resultsFilter = obtainedResultFilter.results;
	const resultPropertiesFilter = obtainedResultFilter.resultProperties;
	const categoriesFilter = obtainedResultFilter.categories;
	const classificationsFilter = obtainedResultFilter.classifications;

	const artifactsFilter = useMemo(() => {
		return (columnFilters.find((filter) => filter.id === COLUMN_ID.ARTIFACTS)
			?.value ?? []) as string[];
	}, [columnFilters]);

	const {
		filteredData,
		filteredDataWithoutResults,
		filteredDataWithoutResultProperties,
		filteredDataWithoutCategories,
		filteredDataWithoutClassifications
	} = useMemo(() => {
		/**
		 * `exclude` names the one axis to ignore while testing a row.
		 *
		 * A facet's own selection must not narrow its own option list. It is
		 * harmless on the AND axes -- once you have picked artifact A, the only
		 * artifacts worth offering are those that co-occur with it -- but on an
		 * OR axis it is fatal: pick UNTRIAGED and the only rows left are
		 * untriaged, so UNTRIAGED becomes the only option and the filter can
		 * never grow to a second value.
		 */
		const matchesRow = (
			row: RunDataResults,
			exclude?:
				| 'results'
				| 'resultProperties'
				| 'categories'
				| 'classifications'
		) => {
			const rowResultProperty = row.has_error
				? RESULT_PROPERTIES.Unexpected
				: RESULT_PROPERTIES.Expected;
			const hasEveryParameter = parametersFilter.every((parameter) =>
				row.parameters?.includes(parameter)
			);
			const hasEveryVerdict = verdictsFilter.every((verdict) =>
				row.obtained_result.verdicts?.includes(verdict)
			);
			const hasEveryArtifact = artifactsFilter.every((artifact) =>
				row.artifacts?.includes(artifact)
			);
			// Any, not every: a result carries one stamp per matching rule, so
			// asking for DEFECT and KNOWN means the results either explains.
			const hasSomeCategory =
				exclude === 'categories' ||
				!categoriesFilter.length ||
				(row.issues ?? []).some((issue) =>
					categoriesFilter.includes(issue.category)
				);
			const hasEveryRequirement = requirementsFilter.every((requirement) =>
				row.requirements?.includes(requirement)
			);
			// One verdict per result, so membership rather than some/every. A
			// passing result with no stamps has none, and matches no selection.
			const rowClassification = resultClassification({
				issues: row.issues,
				hasError: row.has_error,
				effectiveExpected: row.effective_expected
			});
			const hasClassification =
				exclude === 'classifications' ||
				!classificationsFilter.length ||
				(rowClassification
					? classificationsFilter.includes(rowClassification.value)
					: false);
			const matchesResult =
				exclude === 'results' ||
				!resultsFilter.length ||
				resultsFilter.includes(row.obtained_result.result_type);
			const matchesResultProperties =
				exclude === 'resultProperties' ||
				!resultPropertiesFilter.length ||
				resultPropertiesFilter.includes(rowResultProperty);

			return (
				hasEveryParameter &&
				hasEveryVerdict &&
				hasEveryArtifact &&
				hasEveryRequirement &&
				hasSomeCategory &&
				hasClassification &&
				matchesResult &&
				matchesResultProperties
			);
		};

		return {
			filteredData: data.filter((row) => matchesRow(row)),
			filteredDataWithoutResults: data.filter((row) =>
				matchesRow(row, 'results')
			),
			filteredDataWithoutResultProperties: data.filter((row) =>
				matchesRow(row, 'resultProperties')
			),
			filteredDataWithoutCategories: data.filter((row) =>
				matchesRow(row, 'categories')
			),
			filteredDataWithoutClassifications: data.filter((row) =>
				matchesRow(row, 'classifications')
			)
		};
	}, [
		artifactsFilter,
		categoriesFilter,
		classificationsFilter,
		data,
		parametersFilter,
		requirementsFilter,
		resultPropertiesFilter,
		resultsFilter,
		verdictsFilter
	]);

	const requirements = useMemo(() => {
		const values =
			facets?.requirements ??
			Array.from(new Set(filteredData.map((row) => row.requirements).flat()));

		return withBadges(
			values
				.filter((requirement) => requirement !== undefined)
				.map((requirement) => ({
					label: requirement,
					value: requirement
				})),
			// The chip the Requirements cell draws.
			({ label }) => (
				<Badge className={cn('bg-badge-2', FACET_CHIP_CLASS)}>{label}</Badge>
			)
		);
	}, [facets?.requirements, filteredData]);

	const parameters = useMemo(() => {
		const values =
			facets?.parameters ??
			Array.from(new Set(filteredData.map((row) => row.parameters).flat()));

		return withBadges(
			values.filter(Boolean).map((parameter) => ({
				label: toSingleLineParameterLabel(
					formatKeyValueForDisplay(parameter, {
						displayDelimiter: config.keyValueDisplayDelimiter,
						submitDelimiter: config.keyValueSubmitDelimiter
					})
				),
				value: parameter
			})),
			// The chip the Parameters cell draws, on one line as the label is.
			({ label }) => (
				<Badge className={cn('bg-badge-1', FACET_CHIP_CLASS)}>{label}</Badge>
			)
		);
	}, [facets?.parameters, filteredData]);

	const verdicts = useMemo(() => {
		const values =
			facets?.verdicts ??
			Array.from(
				new Set(filteredData.map((row) => row.obtained_result.verdicts).flat())
			);

		return withBadges(
			values.filter(Boolean).map((verdict) => ({
				label: verdict,
				value: verdict
			})),
			// The hollow chip a verdict is under its result in the cell.
			({ label }) => (
				<Badge variant={BadgeVariants.Transparent} className={FACET_CHIP_CLASS}>
					{label}
				</Badge>
			)
		);
	}, [facets?.verdicts, filteredData]);

	/**
	 * The categories the loaded results are actually stamped with, drawn as the
	 * badges the result lines carry -- DEFECT here is the DEFECT chip it selects,
	 * as on `/issues`. The long form stays searchable.
	 *
	 * Counted once per result, however many of its stamps share a category: the
	 * filter matches a result that carries any of the picked categories.
	 */
	const categories = useMemo(
		() =>
			withFacetBadges(
				buildFacetOptions({
					values:
						(facets?.categories as IssueCategory[] | undefined) ??
						filteredDataWithoutCategories.flatMap((row) =>
							Array.from(
								new Set((row.issues ?? []).map((issue) => issue.category))
							)
						),
					order: CATEGORY_ORDER,
					labelFor: (category) => categoryMeta(category).label,
					keywordsFor: (category) => [categoryMeta(category).displayValue]
				}),
				(category: IssueCategory) => <CategoryBadge category={category} />
			),
		[facets?.categories, filteredDataWithoutCategories]
	);

	/**
	 * The classifications the loaded results actually carry, as the same badges
	 * -- AGAIN, with `Counting again` kept for the search.
	 */
	const classifications = useMemo(
		() =>
			withFacetBadges(
				buildFacetOptions({
					values:
						(facets?.classifications as ResultClassification[] | undefined) ??
						filteredDataWithoutClassifications
							.map(
								(row) =>
									resultClassification({
										issues: row.issues,
										hasError: row.has_error,
										effectiveExpected: row.effective_expected
									})?.value
							)
							.filter((value) => value !== undefined),
					order: RESULT_CLASSIFICATION_ORDER,
					labelFor: (value) => RESULT_CLASSIFICATION_META[value].label,
					keywordsFor: (value) => [
						RESULT_CLASSIFICATION_META[value].displayValue
					]
				}),
				(classification: ResultClassification) => (
					<ResultClassificationBadge classification={classification} />
				)
			),
		[facets?.classifications, filteredDataWithoutClassifications]
	);

	const results = useMemo(() => {
		const orderedResultTypes = Object.values(RESULT_TYPE);
		const values =
			(facets?.results as RESULT_TYPE[] | undefined) ??
			Array.from(
				new Set(
					filteredDataWithoutResults.map(
						(row) => row.obtained_result.result_type
					)
				)
			);

		return withBadges(
			values
				.filter(Boolean)
				.sort(
					(a, b) =>
						orderedResultTypes.indexOf(a) - orderedResultTypes.indexOf(b)
				)
				.map((result) => ({
					label: result,
					value: result
				})),
			// The cell colours a result by whether it was expected, which a
			// result type on its own cannot know: FAILED is green when it was
			// meant to fail. The plain chip makes no claim; Result Type carries
			// the colour.
			({ label }) => <Badge className={FACET_CHIP_CLASS}>{label}</Badge>
		);
	}, [facets?.results, filteredDataWithoutResults]);

	const resultProperties = useMemo(() => {
		const values =
			(facets?.result_properties as RESULT_PROPERTIES[] | undefined) ??
			Array.from(
				new Set(
					filteredDataWithoutResultProperties.map((row) =>
						row.has_error
							? RESULT_PROPERTIES.Unexpected
							: RESULT_PROPERTIES.Expected
					)
				)
			);

		return withBadges(
			values
				.filter((resultProperty) => resultProperty in RESULT_PROPERTIES_LABEL)
				.map((resultProperty) => ({
					label: RESULT_PROPERTIES_LABEL[resultProperty],
					value: resultProperty
				})),
			// Upper case, as the result it qualifies is: PASSED, EXPECTED.
			({ label, value }) => (
				<Badge variant={RESULT_PROPERTIES_BADGE_VARIANT[value]}>
					{label.toUpperCase()}
				</Badge>
			)
		);
	}, [facets?.result_properties, filteredDataWithoutResultProperties]);

	const artifacts = useMemo(() => {
		const values =
			facets?.artifacts ??
			Array.from(new Set(filteredData.map((row) => row.artifacts).flat()));

		return withBadges(
			values
				.filter(Boolean)
				.filter((artifact) => artifact !== undefined)
				.map((artifact) => ({
					label: artifact,
					value: artifact
				})),
			// The chip the Artifacts cell draws.
			({ label }) => (
				<Badge className={cn('bg-badge-16', FACET_CHIP_CLASS)}>{label}</Badge>
			)
		);
	}, [facets?.artifacts, filteredData]);

	function handleClearFilters() {
		trackEvent(analyticsEventNames.resultTableFiltersReset, {
			activeFilterCount: columnFilters.length
		});

		setColumnFilters([]);
		resetLocalRequirements();
	}

	// The same write a click on a requirement chip makes: the selection
	// lives with the requirements shared across tables, and the column
	// filter follows it.
	function handleRequirementsFilterChange(values: string[] | undefined) {
		setLocalRequirements(values ?? []);
		handleFilterChange(COLUMN_ID.REQUIREMENTS, values);
	}

	function handleFilterChange(id: string, values: string[] | undefined) {
		setColumnFilters((prev) =>
			createNextState(prev, (draft) => {
				const index = draft.findIndex((filter) => filter.id === id);
				const nextValue = values ?? [];

				if (nextValue.length === 0) {
					if (index !== -1) {
						draft.splice(index, 1);
					}
					return;
				}

				if (index === -1) {
					draft.push({ id, value: nextValue });
					return;
				}

				draft[index].value = nextValue;
			})
		);
	}

	function handleObtainedResultFilterChange(
		updater: (
			filter: ReturnType<typeof ObtainedResultFilterSchema.parse>
		) => ReturnType<typeof ObtainedResultFilterSchema.parse>
	) {
		setColumnFilters((prev) =>
			createNextState(prev, (draft) => {
				const index = draft.findIndex(
					(filter) => filter.id === COLUMN_ID.OBTAINED_RESULT
				);
				const currentFilter =
					index === -1
						? ObtainedResultFilterSchema.parse(undefined)
						: ObtainedResultFilterSchema.parse(draft[index].value);
				const nextFilter = updater(currentFilter);

				if (obtainedResultFilterCount(nextFilter) === 0) {
					if (index !== -1) {
						draft.splice(index, 1);
					}
					return;
				}

				if (index === -1) {
					draft.push({ id: COLUMN_ID.OBTAINED_RESULT, value: nextFilter });
					return;
				}

				draft[index].value = nextFilter;
			})
		);
	}

	function handleVerdictsFilterChange(values: string[] | undefined) {
		handleObtainedResultFilterChange((filter) => ({
			...filter,
			verdicts: values ?? []
		}));
	}

	function handleResultsFilterChange(values: string[] | undefined) {
		handleObtainedResultFilterChange((filter) => ({
			...filter,
			results: (values ?? []).filter((value): value is RESULT_TYPE =>
				resultValues.has(value as RESULT_TYPE)
			)
		}));
	}

	function handleCategoriesFilterChange(values: string[] | undefined) {
		handleObtainedResultFilterChange((filter) => ({
			...filter,
			categories: values ?? []
		}));
	}

	function handleClassificationsFilterChange(values: string[] | undefined) {
		handleObtainedResultFilterChange((filter) => ({
			...filter,
			classifications: values ?? []
		}));
	}

	function handleResultPropertiesFilterChange(values: string[] | undefined) {
		handleObtainedResultFilterChange((filter) => ({
			...filter,
			resultProperties: (values ?? []).filter(
				(value): value is RESULT_PROPERTIES =>
					resultPropertiesValues.has(value as RESULT_PROPERTIES)
			)
		}));
	}

	return {
		requirements,
		parameters,
		verdicts,
		results,
		resultProperties,
		categories,
		classifications,
		artifacts,
		requirementsFilter,
		parametersFilter,
		verdictsFilter,
		resultsFilter,
		resultPropertiesFilter,
		categoriesFilter,
		classificationsFilter,
		artifactsFilter,
		onClearFilters: handleClearFilters,
		onFilterChange: handleFilterChange,
		onRequirementsFilterChange: handleRequirementsFilterChange,
		onVerdictsFilterChange: handleVerdictsFilterChange,
		onResultsFilterChange: handleResultsFilterChange,
		onResultPropertiesFilterChange: handleResultPropertiesFilterChange,
		onCategoriesFilterChange: handleCategoriesFilterChange,
		onClassificationsFilterChange: handleClassificationsFilterChange
	};
}

const compressedColumnFiltersParam = withDefault(
	{
		encode: (value) => {
			if (value === null || value === undefined) {
				return value;
			}

			return encodeCompressedState(value);
		},
		decode: (value) => decodeCompressedOrJsonState(value)
	} as QueryParamConfig<
		Record<string, ColumnFiltersState> | undefined,
		Record<string, ColumnFiltersState>
	>,
	{}
);

function isLegacyColumnFiltersValue(value: string | null): boolean {
	if (!value || isCompressedStateValue(value)) {
		return false;
	}

	try {
		JSON.parse(value);
		return true;
	} catch {
		return false;
	}
}

function getFilterSelectionCount(
	filter: ColumnFiltersState[number] | undefined
) {
	if (!filter) {
		return 0;
	}

	if (Array.isArray(filter.value)) {
		return filter.value.length;
	}

	const obtainedResult = ObtainedResultFilterSchema.safeParse(filter.value);
	if (obtainedResult.success) {
		return obtainedResultFilterCount(obtainedResult.data);
	}

	return 0;
}

function findFilterById(columnFilters: ColumnFiltersState, id: string) {
	return columnFilters.find((filter) => filter.id === id);
}

/** Whether any filter of `columnFilters` selects something. */
function hasAnySelection(columnFilters: ColumnFiltersState): boolean {
	return columnFilters.some((filter) => {
		const value = StringArraySchema.safeParse(filter.value);

		if (value.success) return value.data.length > 0;

		if (filter.id === COLUMN_ID.OBTAINED_RESULT) {
			const obtainedResult = ObtainedResultFilterSchema.safeParse(filter.value);

			if (!obtainedResult.success) return false;

			return obtainedResultFilterCount(obtainedResult.data) > 0;
		}

		return false;
	});
}

function useColumnFilters(rowId: string) {
	const [queryColumnFilters, setQueryColumnFilters] = useQueryParam<
		Record<string, ColumnFiltersState> | undefined,
		Record<string, ColumnFiltersState>
	>('columnFilters', compressedColumnFiltersParam, { updateType: 'replaceIn' });
	const { localRequirements, setLocalRequirements } = useGlobalRequirements();

	useMount(() => {
		const columnFiltersParamValue = new URLSearchParams(
			window.location.search
		).get('columnFilters');

		if (!isLegacyColumnFiltersValue(columnFiltersParamValue)) {
			return;
		}

		setQueryColumnFilters(queryColumnFilters, 'replaceIn');
	});

	const columnFilters = useMemo(() => {
		const currentFilters = queryColumnFilters?.[rowId] ?? [];
		const filtersWithoutRequirements = currentFilters.filter(
			(filter) => filter.id !== COLUMN_ID.REQUIREMENTS
		);

		return [
			...filtersWithoutRequirements,
			{ id: COLUMN_ID.REQUIREMENTS, value: localRequirements }
		];
	}, [localRequirements, queryColumnFilters, rowId]);

	const setColumnFilters = useCallback(
		(updater: Updater<ColumnFiltersState>) => {
			const nextState =
				typeof updater === 'function' ? updater(columnFilters) : updater;

			const maybeChangedFilterIds = new Set<string>([
				...columnFilters.map((filter) => filter.id),
				...nextState.map((filter) => filter.id)
			]);

			for (const filterId of maybeChangedFilterIds) {
				const previousFilter = findFilterById(columnFilters, filterId);
				const nextFilter = findFilterById(nextState, filterId);

				const previousValue = JSON.stringify(previousFilter?.value ?? null);
				const nextValue = JSON.stringify(nextFilter?.value ?? null);

				if (previousValue === nextValue) {
					continue;
				}

				trackEvent(analyticsEventNames.resultTableFilterChange, {
					filterId,
					previousCount: getFilterSelectionCount(previousFilter),
					nextCount: getFilterSelectionCount(nextFilter)
				});
			}

			// A table that selects nothing has nothing to keep in the URL: Reset
			// leaves no trace of it, and a link with no table left carries no
			// parameter at all.
			setQueryColumnFilters((prev) => {
				const next = { ...prev };

				if (hasAnySelection(nextState)) {
					next[rowId] = nextState;
				} else {
					delete next[rowId];
				}

				return Object.keys(next).length > 0 ? next : undefined;
			});
		},
		[columnFilters, rowId, setQueryColumnFilters]
	);

	const resetLocalRequirements = useCallback(() => {
		setColumnFilters([]);
		setLocalRequirements([]);
	}, [setColumnFilters, setLocalRequirements]);

	const hasFilters = hasAnySelection(columnFilters);

	return {
		columnFilters,
		setColumnFilters,
		hasFilters,
		resetLocalRequirements
	};
}
