/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	CSSProperties,
	ReactNode,
	memo,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState
} from 'react';
import { VirtualItem, useVirtualizer } from '@tanstack/react-virtual';
import { PopoverPortal } from '@radix-ui/react-popover';
import * as PopoverPrimitive from '@radix-ui/react-popover';

import {
	LinkWithProject,
	useNavigateWithProject
} from '@/bublik/features/projects';
import { routes } from '@/router';
import { SummaryBadge } from '../runs-table/columns/column-summary/summary-badge';
import { RUN_STATUS, RunsData } from '@/shared/types';
import {
	Badge,
	BadgeList,
	BadgeListItem,
	BadgeVariants,
	ButtonTw,
	CardHeader,
	ColumnCheckmark,
	ColumnsVisibility,
	ColumnVisibilityItem,
	ConclusionHoverCard,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
	HoverCard,
	Icon,
	Kbd,
	Popover,
	PopoverTrigger,
	Separator,
	Skeleton,
	TableNode,
	Tooltip,
	cn,
	getRunStatusInfo
} from '@/shared/tailwind-ui';
import { BublikEmptyState, BublikErrorState } from '@/bublik/features/ui-state';
import { useLocalStorage, usePhysicalHotkeys } from '@/shared/hooks';
import { formatTimestampToFull } from '@/shared/utils';

import {
	RunsProgressFilterSummary,
	RunsProgressGroup,
	RunsProgressPackage,
	RunsProgressRow,
	RunsProgressRun,
	RunsProgressTrendDirection
} from './runs-progress.types';
import {
	MetricDelta,
	getExpectedTotal,
	getMetricDelta,
	getMetricToneClassName,
	getNodeStats,
	getStatsTotal,
	getUnexpectedTotal
} from './runs-progress.utils';
import {
	Sparkline,
	SparklineHoverChart,
	SparklinePoint
} from './runs-progress.sparkline';
import {
	HighlightContext,
	HighlightStore,
	RunsProgressColumnId,
	createHighlightStore,
	useCellHighlight,
	useHighlightStore,
	useRowBottomHighlight
} from './runs-progress.highlight-store';

const ROW_HEIGHT = 34;
const HEADER_STRIP_HEIGHT = 34;
const HEADER_HEIGHT = 178;
const GROUP_HEADER_HEIGHT = 28;
const TIME_GROUP_HEADER_HEIGHT = 28;
const OBJECTIVE_COLUMN_WIDTH = 400;
const LEFT_COLUMN_WIDTH = 380;
const SPARKLINE_WIDTH = 76;
const GROUP_COLORS = [
	'bg-badge-1',
	'bg-badge-2',
	'bg-badge-3',
	'bg-badge-5',
	'bg-badge-6',
	'bg-badge-7'
];
const METRIC_COLUMN_WIDTH = 104;
const MIN_RUN_COLUMN_WIDTH = 444;

const TIME_FRAME_OPTIONS: { days: number; label: string; short: string }[] = [
	{ days: 1, label: '1 day', short: '1d' },
	{ days: 3, label: '3 days', short: '3d' },
	{ days: 7, label: '1 week', short: '1w' },
	{ days: 14, label: '14 days', short: '14d' }
];

function getTimeFrameLabel(
	days: number | null,
	key: 'label' | 'short'
): string {
	return TIME_FRAME_OPTIONS.find((option) => option.days === days)?.[key] ?? '';
}

type RunsProgressColumn = {
	id: RunsProgressColumnId;
	label: string;
	shortLabel: string;
	trendDirection: RunsProgressTrendDirection;
	badgeVariant: BadgeVariants;
	icon: ReactNode;
};

const EXPECTED_ICON = (
	<Icon
		name="InformationCircleCheckmark"
		size={14}
		className="text-text-expected"
	/>
);
const UNEXPECTED_ICON = (
	<Icon
		name="InformationCircleExclamationMark"
		size={14}
		className="text-text-unexpected"
	/>
);
const ABNORMAL_ICON = (
	<Icon
		name="InformationCircleQuestionMark"
		size={14}
		className="text-text-unexpected"
	/>
);

const RESULT_COLUMNS: RunsProgressColumn[] = [
	{
		id: 'total',
		label: 'Total',
		shortLabel: 'Total',
		trendDirection: 'neutral',
		badgeVariant: BadgeVariants.PrimaryActive,
		icon: null
	},
	{
		id: 'run',
		label: 'Run',
		shortLabel: 'Run',
		trendDirection: 'neutral',
		badgeVariant: BadgeVariants.PrimaryActive,
		icon: null
	},
	{
		id: 'totalExpected',
		label: 'Expected',
		shortLabel: 'Expected',
		trendDirection: 'neutral',
		badgeVariant: BadgeVariants.ExpectedActive,
		icon: EXPECTED_ICON
	},
	{
		id: 'passedExpected',
		label: 'Passed',
		shortLabel: 'Passed',
		trendDirection: 'higher-is-better',
		badgeVariant: BadgeVariants.ExpectedActive,
		icon: EXPECTED_ICON
	},
	{
		id: 'failedExpected',
		label: 'Failed',
		shortLabel: 'Failed',
		trendDirection: 'neutral',
		badgeVariant: BadgeVariants.ExpectedActive,
		icon: EXPECTED_ICON
	},
	{
		id: 'unexpected',
		label: 'Unexpected',
		shortLabel: 'Unexpected',
		trendDirection: 'lower-is-better',
		badgeVariant: BadgeVariants.UnexpectedActive,
		icon: UNEXPECTED_ICON
	},
	{
		id: 'passedUnexpected',
		label: 'Passed',
		shortLabel: 'Passed',
		trendDirection: 'lower-is-better',
		badgeVariant: BadgeVariants.UnexpectedActive,
		icon: UNEXPECTED_ICON
	},
	{
		id: 'failedUnexpected',
		label: 'Failed',
		shortLabel: 'Failed',
		trendDirection: 'lower-is-better',
		badgeVariant: BadgeVariants.UnexpectedActive,
		icon: UNEXPECTED_ICON
	},
	{
		id: 'skippedExpected',
		label: 'Skipped',
		shortLabel: 'Skipped',
		trendDirection: 'neutral',
		badgeVariant: BadgeVariants.ExpectedActive,
		icon: EXPECTED_ICON
	},
	{
		id: 'skippedUnexpected',
		label: 'Skipped',
		shortLabel: 'Skipped',
		trendDirection: 'lower-is-better',
		badgeVariant: BadgeVariants.UnexpectedActive,
		icon: UNEXPECTED_ICON
	},
	{
		id: 'abnormal',
		label: 'Abnormal',
		shortLabel: 'Abnormal',
		trendDirection: 'lower-is-better',
		badgeVariant: BadgeVariants.Unexpected,
		icon: ABNORMAL_ICON
	}
];

const RUNS_PROGRESS_COL_TO_RUN_COLUMN_ID: Record<RunsProgressColumnId, string> =
	{
		total: 'TOTAL',
		totalExpected: 'EXPECTED_TOTAL',
		run: 'RUN',
		unexpected: 'UNEXPECTED_TOTAL',
		passedExpected: 'PASSED_EXPECTED',
		failedExpected: 'FAILED_EXPECTED',
		passedUnexpected: 'PASSED_UNEXPECTED',
		failedUnexpected: 'FAILED_UNEXPECTED',
		skippedExpected: 'SKIPPED_EXPECTED',
		skippedUnexpected: 'SKIPPED_UNEXPECTED',
		abnormal: 'ABNORMAL'
	};

const DEFAULT_VISIBLE_COLUMNS: RunsProgressColumnId[] = [
	'run',
	'totalExpected',
	'unexpected'
];

const ALL_COLUMN_IDS: RunsProgressColumnId[] = RESULT_COLUMNS.map(
	(column) => column.id
);
const COLUMN_BY_ID = new Map<RunsProgressColumnId, RunsProgressColumn>(
	RESULT_COLUMNS.map((column) => [column.id, column])
);

function RunsProgressLoading() {
	return (
		<main className="flex flex-col bg-white rounded-md">
			<CardHeader label="Runs Progress" />
			<Skeleton className="h-[calc(100vh-220px)] rounded-none" />
		</main>
	);
}

function RunsProgressEmpty() {
	return (
		<BublikEmptyState
			title="No progress data"
			description="No run stats are available for the current filters"
			className="h-[calc(100vh-256px)]"
		/>
	);
}

function RunsProgressError({ error = {} }: { error?: unknown }) {
	return <BublikErrorState error={error} className="h-[calc(100vh-256px)]" />;
}

interface RunsProgressProps {
	runs: RunsProgressRun[];
	rows: RunsProgressRow[];
	groups: RunsProgressGroup[];
	timeGroups: RunsProgressGroup[];
	groupKey: string | null;
	timeFrameDays: number | null;
	onTimeFrameDaysChange: (timeFrameDays: number | null) => void;
	availableGroupKeys: string[];
	onGroupKeyChange: (groupKey: string | null) => void;
	packages: RunsProgressPackage[];
	selectedPackage: string | null;
	onSelectedPackageChange: (packageName: string | null) => void;
	filters: RunsProgressFilterSummary[];
	isFetching?: boolean;
	isCapped?: boolean;
	total?: number;
	cap?: number;
}

function RunsProgress(props: RunsProgressProps) {
	const {
		runs,
		rows,
		groups,
		timeGroups,
		groupKey,
		timeFrameDays,
		onTimeFrameDaysChange,
		availableGroupKeys,
		onGroupKeyChange,
		packages,
		selectedPackage,
		onSelectedPackageChange,
		isFetching,
		isCapped,
		total,
		cap
	} = props;
	const parentRef = useRef<HTMLDivElement>(null);
	const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
	const [sorting, setSorting] = useState<RunsProgressSort[]>([]);
	const storeRef = useRef<HighlightStore>();
	if (!storeRef.current) storeRef.current = createHighlightStore();
	const store = storeRef.current;
	const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	useEffect(
		() => () => {
			if (flashTimeoutRef.current !== null)
				clearTimeout(flashTimeoutRef.current);
		},
		[]
	);

	const handleClearHover = useCallback(() => store.clearHover(), [store]);
	const [storedVisibleColumnIds, setVisibleColumnIds] = useLocalStorage<
		RunsProgressColumnId[]
	>('runs-progress-visible-columns', DEFAULT_VISIBLE_COLUMNS);
	const [storedColumnOrder, setColumnOrder] = useLocalStorage<
		RunsProgressColumnId[]
	>('runs-progress-column-order', ALL_COLUMN_IDS);
	const columnOrder = useMemo(() => {
		const known = storedColumnOrder.filter((id) => COLUMN_BY_ID.has(id));
		const missing = ALL_COLUMN_IDS.filter((id) => !known.includes(id));

		return [...known, ...missing];
	}, [storedColumnOrder]);
	const visibleColumnIds = useMemo(
		() => storedVisibleColumnIds.filter((id) => COLUMN_BY_ID.has(id)),
		[storedVisibleColumnIds]
	);
	const [changesOnly, setChangesOnly] = useLocalStorage<boolean>(
		'runs-progress-changes-only',
		false
	);
	const [showObjective, setShowObjective] = useLocalStorage(
		'runs-progress-show-objective',
		false
	);

	const runIndexById = useMemo(
		() =>
			new Map(runs.map((progressRun, index) => [progressRun.run.id, index])),
		[runs]
	);
	const handleSort = useCallback(
		(runId: number, columnId: RunsProgressColumnId, additive: boolean) => {
			setSorting((current) => {
				const existing = current.find(
					(sort) => sort.runId === runId && sort.columnId === columnId
				);
				const others = additive
					? current.filter(
							(sort) => !(sort.runId === runId && sort.columnId === columnId)
					  )
					: [];

				if (!existing) return [...others, { runId, columnId, desc: true }];
				if (existing.desc) return [...others, { runId, columnId, desc: false }];

				return others;
			});
		},
		[]
	);
	const baseRows = useMemo(
		() => sortRows(rows, sorting, runIndexById),
		[rows, sorting, runIndexById]
	);
	const visibleRows = useMemo(
		() => getVisibleRows(baseRows, expandedRows),
		[baseRows, expandedRows]
	);
	const rowIndexById = useMemo(
		() => new Map(visibleRows.map((row, index) => [row.id, index])),
		[visibleRows]
	);
	const expandableRowIds = useMemo(
		() => getExpandableRowIds(baseRows),
		[baseRows]
	);
	const allExpanded = useMemo(
		() =>
			expandableRowIds.length > 0 &&
			expandableRowIds.every((rowId) => expandedRows[rowId]),
		[expandableRowIds, expandedRows]
	);
	const visibleColumns = useMemo(
		() =>
			columnOrder
				.map((id) => COLUMN_BY_ID.get(id))
				.filter(
					(column): column is RunsProgressColumn =>
						column !== undefined && visibleColumnIds.includes(column.id)
				),
		[columnOrder, visibleColumnIds]
	);
	const runColumnWidth = Math.max(
		visibleColumns.length * METRIC_COLUMN_WIDTH,
		MIN_RUN_COLUMN_WIDTH
	);
	const leftColumnWidth =
		LEFT_COLUMN_WIDTH + (showObjective ? OBJECTIVE_COLUMN_WIDTH : 0);
	const timeBandHeight = timeGroups.length ? TIME_GROUP_HEADER_HEIGHT : 0;
	const groupBandHeight =
		(groups.length ? GROUP_HEADER_HEIGHT : 0) + timeBandHeight;
	const headerHeight = HEADER_HEIGHT + groupBandHeight;
	const groupLabel = [getTimeFrameLabel(timeFrameDays, 'label'), groupKey]
		.filter(Boolean)
		.join(' then ');

	const rowVirtualizer = useVirtualizer({
		count: visibleRows.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => ROW_HEIGHT,
		overscan: 10
	});
	const columnVirtualizer = useVirtualizer({
		count: runs.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => runColumnWidth,
		horizontal: true,
		overscan: 3
	});

	useEffect(() => {
		columnVirtualizer.measure();
	}, [columnVirtualizer, runColumnWidth]);

	const handleJumpToCell = useCallback(
		(rowId: string, runId: number) => {
			const runIndex = runIndexById.get(runId);

			if (runIndex === undefined) return;

			const scrollElement = parentRef.current;

			if (scrollElement) {
				const itemLeft = runIndex * runColumnWidth;
				const visibleWidth = scrollElement.clientWidth - leftColumnWidth;
				const targetLeft = itemLeft - (visibleWidth - runColumnWidth) / 2;
				const maxLeft = scrollElement.scrollWidth - scrollElement.clientWidth;
				const left = Math.max(0, Math.min(targetLeft, maxLeft));

				const rowIndex = rowIndexById.get(rowId);
				let top = scrollElement.scrollTop;

				if (rowIndex !== undefined) {
					const itemTop = rowIndex * ROW_HEIGHT;
					const visibleHeight = scrollElement.clientHeight - headerHeight;
					const targetTop = itemTop - (visibleHeight - ROW_HEIGHT) / 2;
					const maxTop =
						scrollElement.scrollHeight - scrollElement.clientHeight;
					top = Math.max(0, Math.min(targetTop, maxTop));
				}

				scrollElement.scrollTo({ left, top, behavior: 'smooth' });
			}

			const columnId = visibleColumnIds.includes('unexpected')
				? 'unexpected'
				: visibleColumns[0]?.id;

			if (columnId) {
				store.setPinned({ rowId, runId, columnId });
				store.setFlash({ rowId, runId, columnId });
				if (flashTimeoutRef.current !== null) {
					clearTimeout(flashTimeoutRef.current);
				}
				flashTimeoutRef.current = setTimeout(() => {
					store.setFlash(null);
					flashTimeoutRef.current = null;
				}, 3600);
			}
		},
		[
			store,
			runIndexById,
			rowIndexById,
			runColumnWidth,
			leftColumnWidth,
			headerHeight,
			visibleColumnIds,
			visibleColumns
		]
	);

	const virtualRows = rowVirtualizer.getVirtualItems();
	const virtualColumns = columnVirtualizer.getVirtualItems();
	const totalWidth = leftColumnWidth + columnVirtualizer.getTotalSize();
	const totalHeight = headerHeight + rowVirtualizer.getTotalSize();

	useEffect(() => {
		const element: HTMLDivElement | null = parentRef.current;

		if (!element) return;

		const scrollElement = element;

		function handleWheel(event: WheelEvent) {
			if (!event.ctrlKey) return;

			const delta = event.deltaY || event.deltaX;

			if (!delta) return;

			scrollElement.scrollLeft += delta;
			event.preventDefault();
		}

		element.addEventListener('wheel', handleWheel, { passive: false });

		return () => element.removeEventListener('wheel', handleWheel);
	}, []);

	const handleRowToggle = useCallback((rowId: string) => {
		setExpandedRows((state) => ({
			...state,
			[rowId]: !(state[rowId] ?? false)
		}));
	}, []);

	function handleExpandAll() {
		setExpandedRows(
			Object.fromEntries(expandableRowIds.map((rowId) => [rowId, true]))
		);
	}

	function handleCollapseAll() {
		setExpandedRows({});
	}

	const scrollToGroupIndex = useCallback(
		(index: number) => {
			const scroller = parentRef.current;
			const group = groups[index];

			if (!scroller || !group) return;

			const maxLeft = scroller.scrollWidth - scroller.clientWidth;
			const left = Math.max(
				0,
				Math.min(group.startIndex * runColumnWidth, maxLeft)
			);

			scroller.scrollTo({ left, behavior: 'smooth' });
		},
		[groups, runColumnWidth]
	);

	const handleGroupNavigate = useCallback(
		(direction: 'next' | 'previous') => {
			const scroller = parentRef.current;

			if (!scroller || !groups.length) return;

			const runIndex = Math.round(scroller.scrollLeft / runColumnWidth);
			let current = 0;

			for (let i = 0; i < groups.length; i++) {
				if (groups[i].startIndex <= runIndex) current = i;
				else break;
			}

			let target: number;

			if (direction === 'next') {
				target = Math.min(current + 1, groups.length - 1);
			} else {
				const currentStart = groups[current].startIndex * runColumnWidth;
				target =
					scroller.scrollLeft - currentStart > 4
						? current
						: Math.max(current - 1, 0);
			}

			scrollToGroupIndex(target);
		},
		[groups, runColumnWidth, scrollToGroupIndex]
	);

	usePhysicalHotkeys(
		[
			{
				code: 'KeyL',
				callback: () => handleGroupNavigate('next'),
				options: { requireReset: true }
			},
			{
				code: 'KeyH',
				callback: () => handleGroupNavigate('previous'),
				options: { requireReset: true }
			}
		],
		{ enabled: groups.length > 0, ignoreInputs: true, preventDefault: true }
	);

	return (
		<HighlightContext.Provider value={store}>
			<main className={cn('bg-white rounded-md', isFetching && 'opacity-40')}>
				<CardHeader
					label={
						<div className="flex items-center gap-3">
							<span className="text-text-primary text-[0.75rem] font-semibold leading-[0.875rem]">
								Runs Progress
							</span>
							<Separator orientation="vertical" className="h-4" />
							<Legend />
							<Separator orientation="vertical" className="h-4" />
							{packages.length > 1 ? (
								<PackageMenu
									packages={packages}
									selectedPackage={selectedPackage}
									onSelectedPackageChange={onSelectedPackageChange}
								/>
							) : null}
							<GroupByMenu
								groupKey={groupKey}
								timeFrameDays={timeFrameDays}
								onTimeFrameDaysChange={onTimeFrameDaysChange}
								availableGroupKeys={availableGroupKeys}
								onGroupKeyChange={onGroupKeyChange}
							/>
							{packages.length > 1 ? (
								<>
									<Separator orientation="vertical" className="h-4" />
									<span className="inline-flex items-center gap-1 text-[11px] font-medium text-text-unexpected">
										<Icon name="InformationCircleExclamationMark" size={12} />
										Runs span {packages.length} suites — showing{' '}
										{selectedPackage} (
										{packages.find((pkg) => pkg.name === selectedPackage)
											?.runCount ?? 0}
										). Narrow by a meta filter or a project.
									</span>
								</>
							) : isCapped ? (
								<>
									<Separator orientation="vertical" className="h-4" />
									<span className="inline-flex items-center gap-1 text-[11px] font-medium text-text-unexpected">
										<Icon name="InformationCircleExclamationMark" size={12} />
										Showing latest {cap} of {total} runs — pick a date range or
										duration for all.
									</span>
								</>
							) : null}
						</div>
					}
				>
					<div className="flex items-center gap-3">
						<div className="flex items-center gap-2">
							<ButtonTw
								variant="secondary"
								size="xss"
								state={allExpanded && 'active'}
								onClick={allExpanded ? handleCollapseAll : handleExpandAll}
							>
								<Icon
									name="ArrowLeanUp"
									size={20}
									className={cn(
										'mr-1.5 transition-transform',
										!allExpanded && 'rotate-180'
									)}
								/>
								{allExpanded ? 'Collapse All' : 'Expand All'}
							</ButtonTw>
							<ButtonTw
								variant="secondary"
								size="xss"
								state={changesOnly && 'active'}
								onClick={() => setChangesOnly((value) => !value)}
								title="Hide zero and unchanged metric values, keeping only cells that moved between runs"
							>
								<Icon name="Filter" size={18} className="mr-1.5" />
								Changes Only
							</ButtonTw>
						</div>
						<ProgressColumnsVisibility
							visibleColumnIds={visibleColumnIds}
							onVisibleColumnIdsChange={setVisibleColumnIds}
							columnOrder={columnOrder}
							onColumnOrderChange={setColumnOrder}
							showObjective={showObjective}
							onShowObjectiveChange={setShowObjective}
						/>
					</div>
				</CardHeader>
				<div
					ref={parentRef}
					onMouseLeave={handleClearHover}
					className="relative h-[calc(100vh-128px)] overflow-auto overscroll-contain"
				>
					<div
						className="relative"
						style={{ width: totalWidth, height: totalHeight }}
					>
						<div
							className="sticky top-0 z-30 bg-white border-b border-border-primary text-left text-[0.6875rem] font-semibold leading-[0.875rem]"
							style={{ width: totalWidth, height: headerHeight }}
						>
							<div
								className="sticky left-0 z-40 flex h-full bg-white"
								style={{ width: leftColumnWidth }}
							>
								<div
									className="flex h-full flex-1 flex-col justify-end gap-1 px-2 py-2"
									style={{ width: LEFT_COLUMN_WIDTH }}
								>
									<span className="text-[0.75rem] font-semibold uppercase tracking-wide text-text-primary">
										Test procedures
									</span>
									<span className="text-[0.75rem] font-medium text-text-primary">
										{visibleRows.length} visible rows across {runs.length} runs
									</span>
									<span className="text-[0.75rem] font-normal text-text-primary">
										{groupLabel
											? `Grouped by ${groupLabel}. Hold Ctrl to scroll sideways.`
											: 'Trend reads newest → oldest. Hold Ctrl to scroll sideways.'}
									</span>
								</div>
								{showObjective ? (
									<div
										className="relative flex h-full flex-col justify-end gap-1 px-2 py-2"
										style={{ width: OBJECTIVE_COLUMN_WIDTH }}
									>
										<div className="pointer-events-none absolute left-0 top-0 -bottom-px w-0.5 bg-gray-500" />
										<span className="uppercase text-text-primary">
											Objective
										</span>
									</div>
								) : null}
								<div className="pointer-events-none absolute right-0 top-0 -bottom-px w-0.5 bg-gray-500" />
							</div>
							<TimeGroupBands
								timeGroups={timeGroups}
								runColumnWidth={runColumnWidth}
								leftColumnWidth={leftColumnWidth}
							/>
							<GroupBands
								groups={groups}
								runColumnWidth={runColumnWidth}
								leftColumnWidth={leftColumnWidth}
								timeBandHeight={timeBandHeight}
								onNavigate={handleGroupNavigate}
							/>
							{virtualColumns.map((virtualColumn) => {
								const progressRun = runs[virtualColumn.index];

								return (
									<RunHeaderCell
										key={virtualColumn.key}
										run={progressRun.run}
										columns={visibleColumns}
										sorting={sorting}
										onSort={handleSort}
										height={HEADER_HEIGHT}
										style={{
											width: virtualColumn.size,
											transform: `translateX(${
												leftColumnWidth + virtualColumn.start
											}px) translateY(${groupBandHeight}px)`
										}}
									/>
								);
							})}
						</div>
						{virtualRows.map((virtualRow) => {
							const row = visibleRows[virtualRow.index];
							const nextRowId = visibleRows[virtualRow.index + 1]?.id ?? null;

							return (
								<ProgressRow
									key={virtualRow.key}
									row={row}
									runs={runs}
									columns={visibleColumns}
									virtualColumns={virtualColumns}
									showObjective={showObjective}
									leftColumnWidth={leftColumnWidth}
									onJumpToCell={handleJumpToCell}
									isExpanded={isRowExpanded(row, expandedRows)}
									isGrouped={Boolean(groupKey) || Boolean(timeFrameDays)}
									onToggle={handleRowToggle}
									nextRowId={nextRowId}
									changesOnly={changesOnly}
									style={{
										top: 0,
										width: totalWidth,
										height: virtualRow.size,
										transform: `translateY(${
											headerHeight + virtualRow.start
										}px)`
									}}
								/>
							);
						})}
					</div>
				</div>
			</main>
		</HighlightContext.Provider>
	);
}

const ProgressRow = memo(function ProgressRow({
	row,
	runs,
	columns,
	virtualColumns,
	showObjective,
	leftColumnWidth,
	isExpanded,
	isGrouped,
	onToggle,
	onJumpToCell,
	nextRowId,
	changesOnly,
	style
}: {
	row: RunsProgressRow;
	runs: RunsProgressRun[];
	columns: RunsProgressColumn[];
	virtualColumns: VirtualItem[];
	showObjective: boolean;
	leftColumnWidth: number;
	isExpanded: boolean;
	isGrouped: boolean;
	onToggle: (rowId: string) => void;
	onJumpToCell: (rowId: string, runId: number) => void;
	nextRowId: string | null;
	changesOnly: boolean;
	style: CSSProperties;
}) {
	return (
		<div
			className="group/row absolute left-0 text-[0.75rem] leading-[1.125rem] font-medium"
			style={style}
		>
			<RowHeaderCell
				row={row}
				runs={runs}
				isExpanded={isExpanded}
				isGrouped={isGrouped}
				showObjective={showObjective}
				leftColumnWidth={leftColumnWidth}
				nextRowId={nextRowId}
				onToggle={onToggle}
				onJumpToCell={onJumpToCell}
			/>
			{virtualColumns.map((virtualColumn) => (
				<ResultCell
					key={`${virtualColumn.key}-${row.id}`}
					cell={row.cells[virtualColumn.index]}
					columns={columns}
					rowId={row.id}
					nextRowId={nextRowId}
					nextRunId={runs[virtualColumn.index + 1]?.run.id ?? null}
					leftColumnWidth={leftColumnWidth}
					width={virtualColumn.size}
					start={virtualColumn.start}
					changesOnly={changesOnly}
				/>
			))}
		</div>
	);
});

const TimeGroupBands = memo(function TimeGroupBands({
	timeGroups,
	runColumnWidth,
	leftColumnWidth
}: {
	timeGroups: RunsProgressGroup[];
	runColumnWidth: number;
	leftColumnWidth: number;
}) {
	return (
		<>
			{timeGroups.map((group) => (
				<div
					key={group.id}
					className="absolute top-0 z-10 flex items-center border-b border-r-2 border-border-primary bg-badge-0 px-2 text-[0.625rem] font-semibold uppercase tracking-wide text-text-primary"
					style={{
						height: TIME_GROUP_HEADER_HEIGHT,
						width: group.runCount * runColumnWidth,
						left: leftColumnWidth + group.startIndex * runColumnWidth
					}}
					title={group.label}
				>
					<span
						className="sticky inline-flex min-w-0 items-center gap-1 truncate"
						style={{ left: leftColumnWidth + 8 }}
					>
						<Icon name="Calendar" className="size-4 shrink-0" />
						{group.label}
					</span>
				</div>
			))}
		</>
	);
});

const GroupBands = memo(function GroupBands({
	groups,
	runColumnWidth,
	leftColumnWidth,
	timeBandHeight,
	onNavigate
}: {
	groups: RunsProgressGroup[];
	runColumnWidth: number;
	leftColumnWidth: number;
	timeBandHeight: number;
	onNavigate: (direction: 'next' | 'previous') => void;
}) {
	return (
		<>
			{groups.map((group, groupIndex) => (
				<div
					key={group.id}
					className={cn(
						'absolute z-10 flex items-center justify-between border-b border-r-2 border-border-primary px-2 text-[0.625rem] font-semibold uppercase tracking-wide text-text-primary',
						GROUP_COLORS[groupIndex % GROUP_COLORS.length]
					)}
					style={{
						height: GROUP_HEADER_HEIGHT,
						top: timeBandHeight,
						width: group.runCount * runColumnWidth,
						left: leftColumnWidth + group.startIndex * runColumnWidth
					}}
					title={group.label}
				>
					<span
						className="sticky min-w-0 truncate"
						style={{ left: leftColumnWidth + 8 }}
					>
						{group.label}
					</span>
					<div
						className="sticky flex shrink-0 items-center gap-1"
						style={{ right: 16 }}
					>
						<Tooltip content="Previous group (h)">
							<ButtonTw
								type="button"
								variant="secondary"
								size="xss"
								className="gap-1 px-1.5"
								aria-label="Previous group"
								onClick={() => onNavigate('previous')}
							>
								<Icon name="ArrowLeanUp" className="-rotate-90 size-5" />
								<Kbd>h</Kbd>
							</ButtonTw>
						</Tooltip>
						<Tooltip content="Next group (l)">
							<ButtonTw
								type="button"
								variant="secondary"
								size="xss"
								className="gap-1 px-1.5"
								aria-label="Next group"
								onClick={() => onNavigate('next')}
							>
								<Kbd>l</Kbd>
								<Icon name="ArrowLeanUp" className="rotate-90 size-5" />
							</ButtonTw>
						</Tooltip>
					</div>
				</div>
			))}
		</>
	);
});

type RunsProgressSort = {
	runId: number;
	columnId: RunsProgressColumnId;
	desc: boolean;
};

function compareRows(
	left: RunsProgressRow,
	right: RunsProgressRow,
	sorting: RunsProgressSort[],
	runIndexById: Map<number, number>
): number {
	for (const sort of sorting) {
		const index = runIndexById.get(sort.runId);

		if (index === undefined) continue;

		const leftValue = getMetricValue(
			sort.columnId,
			getNodeStats(left.cells[index]?.node ?? null)
		);
		const rightValue = getMetricValue(
			sort.columnId,
			getNodeStats(right.cells[index]?.node ?? null)
		);

		if (leftValue !== rightValue) {
			return sort.desc ? rightValue - leftValue : leftValue - rightValue;
		}
	}

	return 0;
}

function sortRows(
	rows: RunsProgressRow[],
	sorting: RunsProgressSort[],
	runIndexById: Map<number, number>
): RunsProgressRow[] {
	if (!sorting.length) return rows;

	return [...rows]
		.sort((left, right) => compareRows(left, right, sorting, runIndexById))
		.map((row) => ({
			...row,
			children: sortRows(row.children, sorting, runIndexById)
		}));
}

function getVisibleRows(
	rows: RunsProgressRow[],
	expandedRows: Record<string, boolean>
): RunsProgressRow[] {
	const visibleRows: RunsProgressRow[] = [];

	function visit(row: RunsProgressRow) {
		visibleRows.push(row);

		if (!isRowExpanded(row, expandedRows)) return;

		row.children.forEach(visit);
	}

	rows.forEach(visit);

	return visibleRows;
}

function isRowExpanded(
	row: RunsProgressRow,
	expandedRows: Record<string, boolean>
): boolean {
	if (row.depth === 0) return true;

	return expandedRows[row.id] ?? false;
}

function getExpandableRowIds(rows: RunsProgressRow[]): string[] {
	const rowIds: string[] = [];

	function visit(row: RunsProgressRow) {
		if (row.children.length && row.depth > 0) rowIds.push(row.id);

		row.children.forEach(visit);
	}

	rows.forEach(visit);

	return rowIds;
}

function ProgressColumnsVisibility({
	visibleColumnIds,
	onVisibleColumnIdsChange,
	columnOrder,
	onColumnOrderChange,
	showObjective,
	onShowObjectiveChange
}: {
	visibleColumnIds: RunsProgressColumnId[];
	onVisibleColumnIdsChange: (columnIds: RunsProgressColumnId[]) => void;
	columnOrder: RunsProgressColumnId[];
	onColumnOrderChange: (columnOrder: RunsProgressColumnId[]) => void;
	showObjective: boolean;
	onShowObjectiveChange: (showObjective: boolean) => void;
}) {
	function handleColumnChange(columnId: string, isChecked: boolean) {
		if (isChecked) {
			onVisibleColumnIdsChange([
				...visibleColumnIds,
				columnId as RunsProgressColumnId
			]);
			return;
		}

		if (visibleColumnIds.length === 1) return;

		onVisibleColumnIdsChange(visibleColumnIds.filter((id) => id !== columnId));
	}

	const items: ColumnVisibilityItem[] = columnOrder.flatMap((id) => {
		const column = COLUMN_BY_ID.get(id);

		if (!column) return [];

		return [
			{
				id,
				label: column.label,
				icon: column.icon,
				checked: visibleColumnIds.includes(id)
			}
		];
	});

	return (
		<ColumnsVisibility
			items={items}
			onColumnToggle={handleColumnChange}
			sortable
			onReorder={(orderedIds) =>
				onColumnOrderChange(orderedIds as RunsProgressColumnId[])
			}
			label="Result Columns"
		>
			<DropdownMenuLabel className="text-xs">Test Info</DropdownMenuLabel>
			<Separator className="h-px my-1 -mx-1" />
			<div
				className="flex cursor-pointer items-center gap-2 rounded py-1.5 pl-[26px] pr-2 text-xs hover:bg-primary-wash"
				onClick={() => onShowObjectiveChange(!showObjective)}
			>
				<ColumnCheckmark checked={showObjective} />
				<span className="select-none">Objective</span>
			</div>
			<Separator className="h-px my-1 -mx-1" />
		</ColumnsVisibility>
	);
}

const NO_GROUPING_VALUE = '__none__';

function GroupByMenu({
	groupKey,
	timeFrameDays,
	onTimeFrameDaysChange,
	availableGroupKeys,
	onGroupKeyChange
}: {
	groupKey: string | null;
	timeFrameDays: number | null;
	onTimeFrameDaysChange: (timeFrameDays: number | null) => void;
	availableGroupKeys: string[];
	onGroupKeyChange: (groupKey: string | null) => void;
}) {
	const [isOpen, setIsOpen] = useState(false);

	const triggerLabel =
		[getTimeFrameLabel(timeFrameDays, 'short'), groupKey]
			.filter(Boolean)
			.join(' · ') || 'Group By';

	return (
		<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenuTrigger asChild>
				<ButtonTw
					variant="secondary"
					size="xss"
					state={
						(isOpen || Boolean(groupKey) || Boolean(timeFrameDays)) && 'active'
					}
				>
					<Icon name="Category" size={20} className="mr-1.5" />
					{triggerLabel === 'Group By' ? 'Group By' : `Group: ${triggerLabel}`}
					<Icon name="ArrowShortSmall" className="ml-1.5" />
				</ButtonTw>
			</DropdownMenuTrigger>
			<DropdownMenuContent collisionPadding={{ right: 15 }} className="w-56">
				<DropdownMenuLabel className="text-xs">
					Group Runs By Time Frame
				</DropdownMenuLabel>
				<Separator className="h-px my-1 -mx-1" />
				<DropdownMenuRadioGroup
					value={
						timeFrameDays === null ? NO_GROUPING_VALUE : String(timeFrameDays)
					}
					onValueChange={(value) =>
						onTimeFrameDaysChange(
							value === NO_GROUPING_VALUE ? null : Number(value)
						)
					}
				>
					<DropdownMenuRadioItem value={NO_GROUPING_VALUE} className="text-xs">
						Off
					</DropdownMenuRadioItem>
					{TIME_FRAME_OPTIONS.map((option) => (
						<DropdownMenuRadioItem
							key={option.days}
							value={String(option.days)}
							className="text-xs"
						>
							{option.label}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
				{availableGroupKeys.length ? (
					<>
						<Separator className="h-px my-1 -mx-1" />
						<DropdownMenuLabel className="text-xs">
							Then By Metadata
						</DropdownMenuLabel>
						<Separator className="h-px my-1 -mx-1" />
						<DropdownMenuRadioGroup
							value={groupKey ?? NO_GROUPING_VALUE}
							onValueChange={(value) =>
								onGroupKeyChange(value === NO_GROUPING_VALUE ? null : value)
							}
						>
							<DropdownMenuRadioItem
								value={NO_GROUPING_VALUE}
								className="text-xs"
							>
								Off
							</DropdownMenuRadioItem>
							{availableGroupKeys.map((key) => (
								<DropdownMenuRadioItem
									key={key}
									value={key}
									className="text-xs"
								>
									{key}
								</DropdownMenuRadioItem>
							))}
						</DropdownMenuRadioGroup>
					</>
				) : null}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function PackageMenu({
	packages,
	selectedPackage,
	onSelectedPackageChange
}: {
	packages: RunsProgressPackage[];
	selectedPackage: string | null;
	onSelectedPackageChange: (packageName: string | null) => void;
}) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenuTrigger asChild>
				<ButtonTw variant="secondary" size="xss" state={isOpen && 'active'}>
					<Icon name="Folder" size={20} className="mr-1.5" />
					{selectedPackage ?? 'Suite'}
					<Icon name="ArrowShortSmall" className="ml-1.5" />
				</ButtonTw>
			</DropdownMenuTrigger>
			<DropdownMenuContent collisionPadding={{ right: 15 }} className="w-64">
				<DropdownMenuLabel className="text-xs">Test Suite</DropdownMenuLabel>
				<Separator className="h-px my-1 -mx-1" />
				<DropdownMenuRadioGroup
					value={selectedPackage ?? ''}
					onValueChange={(value) => onSelectedPackageChange(value || null)}
				>
					{packages.map((pkg) => (
						<DropdownMenuRadioItem
							key={pkg.name}
							value={pkg.name}
							className="text-xs"
						>
							<span className="flex min-w-0 flex-1 items-center justify-between gap-2">
								<span className="truncate">{pkg.name}</span>
								<span className="shrink-0 text-text-secondary tabular-nums">
									{pkg.runCount}
								</span>
							</span>
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function Legend() {
	return (
		<div className="flex items-center gap-2.5 text-[0.6875rem] font-medium text-text-secondary">
			<span className="inline-flex items-center gap-1">
				<span className="text-text-expected">●</span> Improved
			</span>
			<span className="inline-flex items-center gap-1">
				<span className="text-text-unexpected">●</span> Regressed
			</span>
			<span className="inline-flex items-center gap-1">
				<span className="text-[hsl(40_55%_42%)]">●</span> Changed
			</span>
		</div>
	);
}

const RunHeaderCell = memo(function RunHeaderCell({
	run,
	columns,
	sorting,
	onSort,
	height,
	style
}: {
	run: RunsProgressRun['run'];
	columns: RunsProgressColumn[];
	sorting: RunsProgressSort[];
	onSort: (
		runId: number,
		columnId: RunsProgressColumnId,
		additive: boolean
	) => void;
	height: number;
	style: CSSProperties;
}) {
	const metadata = useMemo<BadgeListItem[]>(() => {
		return run.metadata.filter(Boolean).map((tag) => ({ payload: tag }));
	}, [run.metadata]);

	const duration = formatRunDuration(run.start, run.finish);
	const { icon, bg, color } = getRunStatusInfo(run.conclusion as RUN_STATUS);

	return (
		<div className="absolute top-0 bg-white" style={{ ...style, height }}>
			<div className="flex" style={{ height: height - HEADER_STRIP_HEIGHT }}>
				<ConclusionHoverCard
					conclusion={run.conclusion as RUN_STATUS}
					conclusionReason={run.conclusion_reason}
					side="right"
					align="start"
				>
					<div
						className={cn(
							'flex w-6 shrink-0 flex-col items-center pt-2.5',
							bg,
							color
						)}
					>
						{icon}
					</div>
				</ConclusionHoverCard>
				<div className="flex min-w-0 flex-1 overflow-y-auto flex-col gap-2 px-2 py-1.5">
					<div className="flex items-center gap-2">
						<ButtonTw asChild variant="secondary" size="xss">
							<LinkWithProject
								to={`/runs/${run.id}`}
								target="_blank"
								rel="noopener noreferrer"
							>
								<Icon name="BoxArrowRight" className="mr-1.5" />
								Run
							</LinkWithProject>
						</ButtonTw>
						<span className="text-[0.75rem] font-medium leading-tight text-text-primary">
							{formatTimestampToFull(run.start)}
							{duration ? (
								<span className="text-text-secondary/70"> · {duration}</span>
							) : null}
						</span>
					</div>
					<RunSummaryBadges run={run} />
					<RunHealthBar stats={run.stats} />
					{metadata.length ? (
						<div className="min-h-0 flex-1">
							<BadgeList badges={metadata} className="bg-badge-4" />
						</div>
					) : null}
				</div>
			</div>
			<div
				className="absolute bottom-0 left-0 right-0 grid border-y border-border-primary bg-white text-[0.6875rem] font-semibold uppercase leading-[0.875rem]"
				style={{
					height: HEADER_STRIP_HEIGHT,
					gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`
				}}
			>
				{columns.map((column) => {
					const ownIndex = sorting.findIndex(
						(sort) => sort.runId === run.id && sort.columnId === column.id
					);
					const own = ownIndex === -1 ? null : sorting[ownIndex];
					const metricIndex = sorting.findIndex(
						(sort) => sort.columnId === column.id
					);
					const metric = metricIndex === -1 ? null : sorting[metricIndex];

					return (
						<button
							type="button"
							key={column.id}
							onClick={(event) => onSort(run.id, column.id, event.shiftKey)}
							className={cn(
								'flex items-center justify-end gap-1 border-r border-border-primary/60 px-1.5 uppercase transition-colors last:border-r-0 hover:bg-primary-wash',
								own && 'bg-primary-wash text-primary'
							)}
							title={`${column.label} — click to sort, Shift+click for multi-sort`}
						>
							<span className="truncate">{column.shortLabel}</span>
							{column.icon}
							{own ? (
								<span className="inline-flex shrink-0 items-center gap-0.5 text-primary">
									<span>{own.desc ? '▼' : '▲'}</span>
									{sorting.length > 1 && (
										<span className="text-[0.5625rem] tabular-nums">
											{ownIndex + 1}
										</span>
									)}
								</span>
							) : metric ? (
								<span className="inline-flex shrink-0 items-center text-text-secondary/60">
									{metric.desc ? '▼' : '▲'}
								</span>
							) : null}
						</button>
					);
				})}
			</div>
			<div className="pointer-events-none absolute right-0 top-0 bottom-0 w-0.5 bg-gray-500" />
		</div>
	);
});

function RunHealthBar({ stats }: { stats: RunsData['stats'] }) {
	const goodPct = stats.tests_total_ok_percent;
	const badPct = stats.tests_total_nok_percent;

	return (
		<div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-200">
			<div className="h-full bg-[#65cd84]" style={{ width: `${goodPct}%` }} />
			<div className="h-full bg-[#f95c78]" style={{ width: `${badPct}%` }} />
		</div>
	);
}

function RunSummaryBadges({ run }: { run: RunsProgressRun['run'] }) {
	const to = routes.run({ runId: run.id });
	const { stats } = run;
	const navigate = useNavigateWithProject();

	return (
		<div className="flex shrink-0 flex-wrap items-center gap-1">
			<SummaryBadge
				to={to}
				label="Total"
				count={stats.tests_total}
				percentage={stats.tests_total_plan_percent}
				className="bg-badge-9"
			/>
			<SummaryBadge
				to={to}
				label="OK"
				count={stats.tests_total_ok}
				percentage={stats.tests_total_ok_percent}
				className="bg-badge-3"
			/>
			<SummaryBadge
				to={to}
				state={{ openUnexpected: true }}
				onContextMenu={(e) => {
					e.preventDefault();

					if (e.ctrlKey) {
						navigate(to, { state: { openUnexpectedResults: true } });
					} else {
						navigate(to, { state: { openUnexpected: true } });
					}
				}}
				onClick={(e) => {
					e.preventDefault();

					if (e.ctrlKey) {
						navigate(to, { state: { openUnexpectedResults: true } });
					} else {
						navigate(to, { state: { openUnexpected: true } });
					}
				}}
				label="NOK"
				count={stats.tests_total_nok}
				percentage={stats.tests_total_nok_percent}
				className="bg-badge-5"
			/>
		</div>
	);
}

function ObjectiveCell({
	objective,
	width
}: {
	objective?: string;
	width: number;
}) {
	if (!objective) {
		return (
			<div className="relative h-full shrink-0" style={{ width }}>
				<div className="pointer-events-none absolute left-0 top-0 -bottom-px z-10 w-0.5 bg-gray-500" />
			</div>
		);
	}

	return (
		<div className="relative h-full shrink-0" style={{ width }}>
			<div className="pointer-events-none absolute left-0 top-0 -bottom-px z-10 w-0.5 bg-gray-500" />
			<Popover modal>
				<PopoverTrigger asChild>
					<button className="group relative flex h-full w-full items-center px-2 text-left hover:bg-primary-wash">
						<div className="absolute right-0.5 top-1/2 z-10 flex h-full -translate-y-1/2 items-center opacity-0 transition-opacity group-hover:opacity-100">
							<div className="h-full w-6 bg-gradient-to-r from-transparent to-white" />
							<div className="grid h-full w-6 place-items-center bg-white pr-2">
								<Icon name="ChevronDown" size={16} className="text-primary" />
							</div>
						</div>
						<pre className="relative min-w-0 flex-1 truncate font-body text-xs">
							{objective}
						</pre>
					</button>
				</PopoverTrigger>
				<PopoverPortal>
					<PopoverPrimitive.Content
						align="start"
						sideOffset={0}
						className={cn(
							'z-50 rounded-lg bg-white p-1 shadow-popover outline-none transition-none',
							'rdx-state-open:animate-fade-in rdx-state-closed:animate-fade-out'
						)}
						style={{ transform: 'translateY(-73.5px) translateX(-4px)' }}
					>
						<h2 className="px-2 py-1.5 text-xs font-semibold">Objective</h2>
						<Separator className="my-1 h-px" />
						<pre className="whitespace-pre-wrap p-2 font-body text-xs">
							{objective}
						</pre>
					</PopoverPrimitive.Content>
				</PopoverPortal>
			</Popover>
		</div>
	);
}

const RowHeaderCell = memo(function RowHeaderCell({
	row,
	runs,
	isExpanded,
	isGrouped,
	showObjective,
	leftColumnWidth,
	nextRowId,
	onToggle,
	onJumpToCell
}: {
	row: RunsProgressRow;
	runs: RunsProgressRun[];
	isExpanded: boolean;
	isGrouped: boolean;
	showObjective: boolean;
	leftColumnWidth: number;
	nextRowId: string | null;
	onToggle: (rowId: string) => void;
	onJumpToCell: (rowId: string, runId: number) => void;
}) {
	const canExpand = row.children.length > 0;
	const canToggle = canExpand && row.depth > 0;
	const [isChartOpen, setIsChartOpen] = useState(false);
	const highlightBottomBorder = useRowBottomHighlight(row.id, nextRowId);

	const sparklinePoints = useMemo<SparklinePoint[]>(
		() =>
			row.cells.map((cell, index) => {
				const stats = getNodeStats(cell.node);
				const unexpected = getUnexpectedTotal(stats);

				return {
					present: Boolean(cell.node),
					total: getStatsTotal(stats),
					nok: unexpected + stats.abnormal,
					unexpected,
					abnormal: stats.abnormal,
					runId: cell.runId,
					resultId: cell.node?.result_id ?? null,
					runStart: runs[index]?.run.start ?? ''
				};
			}),
		[row.cells, runs]
	);

	return (
		<div
			className={cn(
				'sticky left-0 z-20 flex h-full items-center border-b bg-white text-[0.75rem] font-medium text-text-primary',
				highlightBottomBorder ? 'border-b-primary' : 'border-b-border-primary'
			)}
			style={{ width: leftColumnWidth }}
		>
			<div className="flex h-full min-w-0 flex-1 items-center gap-2 pl-2 pr-3">
				<div className="flex min-w-0 flex-1 items-center">
					<TableNode
						nodeName={row.name}
						nodeType={row.type}
						depth={row.depth}
						onClick={() => canToggle && onToggle(row.id)}
						isExpanded={canExpand ? isExpanded : undefined}
						hideExpander={!canExpand}
						disabled={!canToggle}
					/>
				</div>
				<HoverCard
					open={isChartOpen}
					onOpenChange={setIsChartOpen}
					openDelay={120}
					closeDelay={80}
					side="right"
					align="center"
					content={
						<SparklineHoverChart
							points={sparklinePoints}
							onPointClick={(index) => {
								setIsChartOpen(false);
								onJumpToCell(row.id, sparklinePoints[index].runId);
							}}
						/>
					}
				>
					<div
						className="flex shrink-0 cursor-pointer items-center justify-center"
						style={{ width: SPARKLINE_WIDTH }}
						aria-label={
							isGrouped
								? 'Total results trend across runs (grouped order)'
								: 'Total results trend across runs (newest → oldest)'
						}
					>
						<Sparkline points={sparklinePoints} width={SPARKLINE_WIDTH} />
					</div>
				</HoverCard>
			</div>
			{showObjective ? (
				<ObjectiveCell
					objective={row.objective}
					width={OBJECTIVE_COLUMN_WIDTH}
				/>
			) : null}
			<div className="pointer-events-none absolute right-0 top-0 -bottom-px w-0.5 bg-gray-500" />
			{highlightBottomBorder ? (
				<div className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-primary" />
			) : null}
		</div>
	);
});

const ResultCell = memo(function ResultCell({
	cell,
	columns,
	rowId,
	nextRowId,
	nextRunId,
	leftColumnWidth,
	width,
	start,
	changesOnly
}: {
	cell: RunsProgressRow['cells'][number];
	columns: RunsProgressColumn[];
	rowId: string;
	nextRowId: string | null;
	nextRunId: number | null;
	leftColumnWidth: number;
	width: number;
	start: number;
	changesOnly: boolean;
}) {
	const node = cell.node;
	const stats = getNodeStats(node);
	const previousStats = getNodeStats(cell.previousNode);
	const hasPrevious = Boolean(cell.previousNode);
	const store = useHighlightStore();

	const style = useMemo<CSSProperties>(
		() => ({
			width,
			transform: `translateX(${leftColumnWidth + start}px)`
		}),
		[leftColumnWidth, width, start]
	);
	const handlePin = useCallback(
		(columnId: RunsProgressColumnId) =>
			store.togglePinned({ rowId, runId: cell.runId, columnId }),
		[store, rowId, cell.runId]
	);
	const handleHover = useCallback(
		(columnId: RunsProgressColumnId) =>
			store.setHovered({ rowId, runId: cell.runId, columnId }),
		[store, rowId, cell.runId]
	);

	const columnIds = useMemo(
		() => columns.map((column) => column.id),
		[columns]
	);
	const {
		highlights,
		highlightRunSeparator,
		highlightBottomBorder,
		flashColumnId
	} = useCellHighlight(
		rowId,
		cell.runId,
		nextRunId,
		nextRowId,
		columnIds,
		Boolean(node)
	);

	return (
		<div
			className={cn(
				'absolute top-0 grid h-full items-center border-b bg-white text-[0.6875rem] font-medium',
				highlightBottomBorder ? 'border-b-primary' : 'border-b-border-primary'
			)}
			style={{
				...style,
				gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`
			}}
		>
			{node ? (
				columns.map((column, columnIndex) => {
					const highlight = highlights[columnIndex];
					const highlightRightBorder =
						highlight.right || Boolean(highlights[columnIndex + 1]?.left);
					const isFlashing = column.id === flashColumnId;

					return (
						<ResultColumnValue
							key={column.id}
							column={column}
							stats={stats}
							previousStats={previousStats}
							hasPrevious={hasPrevious}
							runId={cell.runId}
							resultId={node.result_id}
							rowTint={highlight.rowTint}
							isClicked={highlight.clicked}
							isFlashing={isFlashing}
							isLastColumn={columnIndex === columns.length - 1}
							highlightRightBorder={highlightRightBorder}
							changesOnly={changesOnly}
							onPin={handlePin}
							onHover={handleHover}
						/>
					);
				})
			) : (
				<span className="col-span-full px-3 text-text-secondary">No data</span>
			)}
			<div
				className={cn(
					'pointer-events-none absolute right-0 top-0 -bottom-px w-0.5',
					highlightRunSeparator ? 'bg-primary' : 'bg-gray-500'
				)}
			/>
			{highlightBottomBorder ? (
				<div className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-primary" />
			) : null}
		</div>
	);
});

const ResultColumnValue = memo(function ResultColumnValue({
	column,
	stats,
	previousStats,
	hasPrevious,
	runId,
	resultId,
	rowTint,
	isClicked,
	isFlashing,
	isLastColumn,
	highlightRightBorder,
	changesOnly,
	onPin,
	onHover
}: {
	column: RunsProgressColumn;
	stats: ReturnType<typeof getNodeStats>;
	previousStats: ReturnType<typeof getNodeStats>;
	hasPrevious: boolean;
	runId: number;
	resultId: number;
	rowTint: boolean;
	isClicked: boolean;
	isFlashing: boolean;
	isLastColumn: boolean;
	highlightRightBorder: boolean;
	changesOnly: boolean;
	onPin: (columnId: RunsProgressColumnId) => void;
	onHover: (columnId: RunsProgressColumnId) => void;
}) {
	const [isHovered, setIsHovered] = useState(false);
	const value = getMetricValue(column.id, stats);
	const previousValue = getMetricValue(column.id, previousStats);
	const delta = hasPrevious
		? getMetricDelta(value, previousValue, column.trendDirection)
		: null;
	const isUnchanged = hasPrevious ? value === previousValue : value === 0;
	const hideValue = changesOnly && isUnchanged;
	const isSelected = rowTint || isClicked;
	const tintedToneClassName = getMetricToneClassName(
		column.trendDirection,
		value,
		previousValue,
		hasPrevious,
		isSelected
	);
	const selectionFallback = isSelected
		? isClicked
			? 'bg-[rgba(59,130,246,0.24)]'
			: 'bg-[rgba(59,130,246,0.14)]'
		: '';

	return (
		<div
			onMouseEnter={() => {
				setIsHovered(true);
				onHover(column.id);
			}}
			onMouseLeave={() => setIsHovered(false)}
			onClick={() => onPin(column.id)}
			className={cn(
				'group relative flex h-full min-w-0 cursor-pointer items-center justify-end gap-1 px-1.5',
				!isLastColumn && 'border-r',
				!isLastColumn &&
					(highlightRightBorder
						? 'border-r-primary'
						: 'border-r-border-primary/60'),
				tintedToneClassName || selectionFallback,
				isFlashing && 'animate-row-pulse'
			)}
		>
			{isHovered && value !== 0 && !hideValue && (
				<LinkWithProject
					to={routes.run({
						runId,
						targetIterationId: resultId,
						resultFilter: RUNS_PROGRESS_COL_TO_RUN_COLUMN_ID[column.id]
					})}
					target="_blank"
					rel="noopener noreferrer"
					onClick={(event) => event.stopPropagation()}
					title={`Open ${column.label} in run ${runId}`}
					className="absolute left-1.5 top-1/2 z-10 grid size-6 -translate-y-1/2 place-items-center border border-border-primary hover:border-primary rounded bg-white text-primary transition-colors hover:bg-primary hover:text-white"
				>
					<Icon name="BoxArrowRight" size={16} />
				</LinkWithProject>
			)}
			{!hideValue && <TrendArrow delta={delta} />}
			{hideValue ? null : value === 0 ? (
				<span className="px-2 py-0.5 text-text-secondary">0</span>
			) : (
				<Badge variant={column.badgeVariant}>{value}</Badge>
			)}
		</div>
	);
});

function TrendArrow({ delta }: { delta: MetricDelta }) {
	if (!delta) return null;

	return (
		<span
			title={delta.title}
			className={cn(
				'mr-auto inline-flex items-center gap-0.5 text-[0.625rem] font-semibold leading-none tabular-nums',
				delta.status === 'improved' && 'text-text-expected',
				delta.status === 'regressed' && 'text-text-unexpected',
				delta.status === 'changed' && 'text-[hsl(40_55%_42%)]'
			)}
		>
			<TrendArrowGlyph increased={delta.increased} />
			{delta.amount}
		</span>
	);
}

function TrendArrowGlyph({ increased }: { increased: boolean }) {
	return (
		<svg
			viewBox="0 0 10 10"
			className={cn(
				'size-3.5 shrink-0',
				increased ? '-rotate-45' : 'rotate-45'
			)}
			aria-hidden
		>
			<path d="M1 4 L5 4 L5 1.5 L9 5 L5 8.5 L5 6 L1 6 Z" fill="currentColor" />
		</svg>
	);
}

function getMetricValue(
	columnId: RunsProgressColumnId,
	stats: ReturnType<typeof getNodeStats>
): number {
	switch (columnId) {
		case 'total':
			return getStatsTotal(stats);
		case 'totalExpected':
			return getExpectedTotal(stats);
		case 'run':
			return (
				stats.passed +
				stats.passed_unexpected +
				stats.failed +
				stats.failed_unexpected
			);
		case 'passedExpected':
			return stats.passed;
		case 'unexpected':
			return getUnexpectedTotal(stats);
		case 'failedExpected':
			return stats.failed;
		case 'failedUnexpected':
			return stats.failed_unexpected;
		case 'passedUnexpected':
			return stats.passed_unexpected;
		case 'skippedExpected':
			return stats.skipped;
		case 'skippedUnexpected':
			return stats.skipped_unexpected;
		case 'abnormal':
			return stats.abnormal;
	}
}

function formatRunDuration(start: string, finish: string): string {
	const startDate = new Date(start);
	const finishDate = new Date(finish);

	if (Number.isNaN(startDate.getTime()) || Number.isNaN(finishDate.getTime())) {
		return '';
	}

	const totalSeconds = Math.max(
		0,
		Math.round((finishDate.getTime() - startDate.getTime()) / 1000)
	);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
	if (minutes > 0) return `${minutes}m ${String(seconds).padStart(2, '0')}s`;

	return `${seconds}s`;
}

export {
	RunsProgress,
	RunsProgressEmpty,
	RunsProgressError,
	RunsProgressLoading
};
