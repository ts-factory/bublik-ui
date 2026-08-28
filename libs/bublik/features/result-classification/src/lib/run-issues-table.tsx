/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import {
	ColumnDef,
	type VisibilityState,
	getCoreRowModel,
	getExpandedRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable
} from '@tanstack/react-table';

import { useGetRunIssuesQuery } from '@/services/bublik-api';
import { LinkWithProject } from '@/bublik/features/projects';
import {
	ButtonTw,
	ColumnsVisibility,
	DataTableFacetedFilter,
	Icon,
	Pagination,
	Skeleton,
	Tooltip
} from '@/shared/tailwind-ui';
import { BublikEmptyState, BublikErrorState } from '@/bublik/features/ui-state';
import { routes } from '@/router';
import type { IssueCategory, RunIssueRow } from '@/shared/types';

import {
	CATEGORY_ORDER,
	EFFECT_ORDER,
	RUN_ISSUE_EFFECT_META,
	aggregateExpected,
	categoryMeta,
	issueStateMeta,
	runIssueEffect
} from './classification-colors';
import {
	BugKeyChip,
	CategoryBadgeList,
	DispositionBadge,
	IssueStateBadge,
	RunEffectBadge
} from './classification-badges';
import {
	ClassificationFooter,
	ClassificationSearch,
	ClassificationTable,
	ClassificationToolbar,
	ClassificationToolbarSeparator,
	ExpandButton,
	columnVisibilityItems,
	useColumnVisibility
} from './classification-table';
import {
	buildFacetOptions,
	makeSearchFilter,
	someOfFilter
} from './classification-table.utils';
import { useClassificationTableState } from './use-classification-table-state';
import {
	ISSUE_ACTIONS_COLUMN_CLASS,
	ISSUE_ACTIONS_HEADER_CLASS,
	IssueStateActions
} from './issue-actions';
import { RunIssueResults } from './issue-results';

interface RunIssuesTableProps {
	runId: number | string;
	projectId?: number;
	/** Rendered after the filters — e.g. the run-level Apply Rules action. */
	toolbarActions?: ReactNode;
}

/**
 * Ordered so the row reads as a sentence: *which* issue — its tracker key, then
 * its title — *how much* of the run it accounts for, whether it is still open,
 * *what it does* to the unexpected count, and only then the two fields that
 * explain that verdict — the cause and the decision.
 *
 * State sits that early because it outranks everything after it: closing an
 * issue deactivates its rules and un-suppresses every result they were hiding,
 * so a closed issue quietly cancels the disposition further down the row.
 */
const COLUMN_ID = {
	EXPANDER: 'expander',
	ACTIONS: 'actions',
	BUG_KEY: 'bug_key',
	ISSUE: 'issue',
	RESULTS: 'result_count',
	STATE: 'state',
	EFFECT: 'effect',
	CATEGORIES: 'categories',
	DISPOSITION: 'disposition',
	FILLER: 'filler'
} as const;

const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {};

/** Module-level so the URL-state hook's memos do not churn every render. */
const FILTER_KEYS = [
	COLUMN_ID.STATE,
	COLUMN_ID.EFFECT,
	COLUMN_ID.CATEGORIES
] as const;

const searchFilter = makeSearchFilter<RunIssueRow>((issue) => [
	issue.title,
	issue.bug_key,
	`#${issue.issue_id}`
]);

function getColumns(projectId?: number): ColumnDef<RunIssueRow, unknown>[] {
	return [
		{
			id: COLUMN_ID.EXPANDER,
			enableHiding: false,
			header: () => null,
			meta: { className: 'w-9' },
			enableSorting: false,
			cell: ({ row }) => (
				<ExpandButton
					isExpanded={row.getIsExpanded()}
					onClick={row.getToggleExpandedHandler()}
					label={
						row.getIsExpanded() ? 'Hide results' : 'Show classified results'
					}
					testId="run-issue-expander"
				/>
			)
		},
		{
			// Straight after the expander, matching the issues list: an issue can be
			// closed from wherever you found it, without a detour through its own
			// page. Closing here un-suppresses results in this very run, so the
			// table behind it re-reads on success.
			id: COLUMN_ID.ACTIONS,
			enableHiding: false,
			header: 'Actions',
			meta: {
				className: ISSUE_ACTIONS_COLUMN_CLASS,
				headerClassName: ISSUE_ACTIONS_HEADER_CLASS
			},
			enableSorting: false,
			cell: ({ row }) => (
				<IssueStateActions
					issueId={row.original.issue_id}
					title={row.original.title}
					state={row.original.state}
					projectId={projectId}
				/>
			)
		},
		{
			// The external identity, on the same line as the title rather than
			// wrapped under it: the chip plus, when the project resolves one, the
			// link out to the tracker.
			//
			// `w-px` is under min-content, so the column collapses to exactly the
			// widest key it holds — `whitespace-nowrap` keeps that from being
			// measured mid-key, since `E2E-105` would otherwise break at the dash.
			// Inside the cell the chip and the link sit at opposite ends, so the
			// links land in one vertical line no matter how short the key is.
			id: COLUMN_ID.BUG_KEY,
			accessorFn: (row) => row.bug_key ?? '',
			header: 'Key',
			meta: { className: 'w-px whitespace-nowrap', badgeCell: true },
			enableSorting: false,
			cell: ({ row }) => {
				const { issue_id, bug_key, bug_url } = row.original;

				return (
					<BugKeyChip
						bugKey={bug_key}
						bugUrl={bug_url}
						issueId={issue_id}
						fallback={`#${issue_id}`}
						className="flex justify-between w-full gap-2"
					/>
				);
			}
		},
		{
			// Capped, not flexible: a title is a handful of words, and letting the
			// column soak up every spare pixel pushes the badges off to the edge of
			// the table. Anything longer truncates — the tooltip carries the rest.
			id: COLUMN_ID.ISSUE,
			accessorFn: (row) => row.title,
			header: 'Issue',
			meta: { className: 'w-[26rem]' },
			filterFn: searchFilter,
			cell: ({ row }) => {
				const { issue_id, title } = row.original;

				return (
					<Tooltip content={`Manage the rules behind ${title}`}>
						<LinkWithProject
							to={routes.issue({ issueId: issue_id })}
							className="block max-w-[25rem] font-medium truncate text-text-primary hover:text-primary hover:underline"
						>
							{title}
						</LinkWithProject>
					</Tooltip>
				);
			}
		},
		{
			id: COLUMN_ID.RESULTS,
			accessorFn: (row) => row.result_count,
			header: 'Results',
			meta: { className: 'w-px whitespace-nowrap' },
			cell: ({ row }) => (
				<button
					type="button"
					onClick={row.getToggleExpandedHandler()}
					aria-expanded={row.getIsExpanded()}
					className="font-medium tabular-nums hover:text-primary hover:underline"
					data-testid="run-issue-result-count"
				>
					{row.original.result_count}
				</button>
			)
		},
		{
			id: COLUMN_ID.STATE,
			accessorFn: (row) => row.state,
			header: 'State',
			meta: { className: 'w-px whitespace-nowrap', badgeCell: true },
			enableSorting: false,
			filterFn: someOfFilter,
			cell: ({ row }) => <IssueStateBadge state={row.original.state} />
		},
		{
			id: COLUMN_ID.EFFECT,
			accessorFn: (row) => runIssueEffect(row).value,
			// Named for the axis rather than for one end of it: the column reports
			// suppressed / counting again / unexpected / undecided, and heading it
			// "Counts as unexpected" read as a yes-or-no question that three of
			// those four answers do not answer. The badges carry the specifics.
			header: 'Effect On Run',
			meta: { className: 'w-px whitespace-nowrap', badgeCell: true },
			enableSorting: false,
			filterFn: someOfFilter,
			cell: ({ row }) => (
				<RunEffectBadge effect={runIssueEffect(row.original).value} />
			)
		},
		{
			id: COLUMN_ID.CATEGORIES,
			accessorFn: (row) => row.categories.map((c) => c.category),
			header: 'Categories',
			meta: { className: 'w-56', badgeCell: true },
			enableSorting: false,
			filterFn: someOfFilter,
			cell: ({ row }) => (
				<CategoryBadgeList
					categories={row.original.categories.map((c) => c.category)}
				/>
			)
		},
		{
			id: COLUMN_ID.DISPOSITION,
			accessorFn: (row) => aggregateExpected(row.categories),
			header: 'Disposition',
			meta: { className: 'w-28', badgeCell: true },
			enableSorting: false,
			cell: ({ row }) => (
				<DispositionBadge
					expected={aggregateExpected(row.original.categories)}
					aggregate
				/>
			)
		},
		{
			// A `w-full` table has to spend its spare width on *some* column, and on
			// a wide screen that is hundreds of pixels. Spent on a data column it
			// reads as a broken layout — a lone chip stranded in an empty cell, or
			// a gap between the badges and the verdict. This column exists to be
			// empty, so every column that carries something stays snug.
			id: COLUMN_ID.FILLER,
			enableHiding: false,
			header: () => null,
			enableSorting: false,
			cell: () => null
		}
	];
}

export function RunIssuesTableLoading() {
	return (
		<div className="flex flex-col gap-1 p-2">
			{Array.from({ length: 10 }, () => 0).map((_, idx) => (
				<Skeleton key={idx} className="h-10 rounded-md" />
			))}
		</div>
	);
}

/** Options carry live counts so an empty facet is obvious before you open it. */
function useFacetOptions(issues: RunIssueRow[]) {
	return useMemo(
		() => ({
			stateOptions: buildFacetOptions({
				values: issues.map((issue) => issue.state),
				order: ['open', 'closed'] as const,
				labelFor: (state) => issueStateMeta(state).label
			}),
			effectOptions: buildFacetOptions({
				values: issues.map((issue) => runIssueEffect(issue).value),
				order: EFFECT_ORDER,
				labelFor: (effect) => RUN_ISSUE_EFFECT_META[effect].label
			}),
			categoryOptions: buildFacetOptions({
				values: issues.flatMap((issue) =>
					Array.from(new Set(issue.categories.map((c) => c.category)))
				) as IssueCategory[],
				order: CATEGORY_ORDER,
				labelFor: (category) => categoryMeta(category).displayValue
			})
		}),
		[issues]
	);
}

export function RunIssuesTable({
	runId,
	projectId,
	toolbarActions
}: RunIssuesTableProps) {
	// Run-scoped: an unscoped answer is never the one we want, and projectId
	// arrives a render late (it comes from the run details query).
	const { data, isLoading, error } = useGetRunIssuesQuery(
		projectId === undefined ? skipToken : { runId, projectId }
	);

	const scrollRef = useRef<HTMLDivElement>(null);
	const [columnVisibility, setColumnVisibility] = useColumnVisibility(
		'run-issues',
		DEFAULT_COLUMN_VISIBILITY
	);
	const {
		pagination,
		onPaginationChange,
		columnFilters,
		onColumnFiltersChange,
		sorting,
		onSortingChange,
		search,
		setSearch,
		hasFilters,
		resetFilters,
		clampPage
	} = useClassificationTableState({
		filterKeys: FILTER_KEYS,
		searchColumnId: COLUMN_ID.ISSUE,
		defaultSorting: [{ id: COLUMN_ID.RESULTS, desc: true }]
	});

	const issues = useMemo(() => data ?? [], [data]);
	const columns = useMemo(() => getColumns(projectId), [projectId]);
	const { stateOptions, effectOptions, categoryOptions } =
		useFacetOptions(issues);

	const table = useReactTable({
		data: issues,
		columns,
		state: { columnFilters, sorting, pagination, columnVisibility },
		onColumnVisibilityChange: setColumnVisibility,
		onColumnFiltersChange,
		onSortingChange,
		onPaginationChange,
		getRowId: (row) => String(row.issue_id),
		getRowCanExpand: () => true,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getExpandedRowModel: getExpandedRowModel()
	});

	const pageCount = table.getPageCount();

	// A shared link can outlive the rows it pointed at. Client-side pagination
	// does not clamp on its own, so `?page=9` on a four-page table would render
	// nothing at all, with no hint why.
	useEffect(() => clampPage(pageCount), [pageCount, clampPage]);

	const getFilterValue = (columnId: string) =>
		(table.getColumn(columnId)?.getFilterValue() as string[] | undefined) ?? [];

	const setFilterValue = (columnId: string, values: string[] | undefined) =>
		table
			.getColumn(columnId)
			?.setFilterValue(values?.length ? values : undefined);

	const rows = table.getRowModel().rows;
	const matchedCount = table.getFilteredRowModel().rows.length;

	function goToPage(page: number) {
		table.setPageIndex(page - 1);
		scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
	}

	// projectId undefined => query skipped, so isLoading is false. Keep the
	// skeleton up rather than flashing the empty state.
	if (isLoading || projectId === undefined) return <RunIssuesTableLoading />;

	if (error) return <BublikErrorState error={error} className="h-full" />;

	if (!issues.length) {
		return (
			<BublikEmptyState
				title="No issues"
				description="Nothing in this run is classified yet. Classify a failing result, or apply the active rules to this run."
				className="h-full"
			/>
		);
	}

	return (
		<div className="flex flex-col flex-1 min-h-0">
			<ClassificationToolbar>
				<span className="text-[0.75rem] font-semibold leading-[0.875rem] text-text-primary">
					Issues
				</span>
				<ClassificationToolbarSeparator />
				<ClassificationSearch
					value={search}
					onChange={setSearch}
					placeholder="Search title or key"
					testId="run-issues-search"
					className="min-w-[220px]"
				/>
				<DataTableFacetedFilter
					title="State"
					size="xss"
					options={stateOptions}
					value={getFilterValue(COLUMN_ID.STATE)}
					onChange={(values) => setFilterValue(COLUMN_ID.STATE, values)}
					disabled={!stateOptions.length}
				/>
				<DataTableFacetedFilter
					title="Effect On Run"
					size="xss"
					options={effectOptions}
					value={getFilterValue(COLUMN_ID.EFFECT)}
					onChange={(values) => setFilterValue(COLUMN_ID.EFFECT, values)}
					disabled={!effectOptions.length}
				/>
				<DataTableFacetedFilter
					title="Category"
					size="xss"
					options={categoryOptions}
					value={getFilterValue(COLUMN_ID.CATEGORIES)}
					onChange={(values) => setFilterValue(COLUMN_ID.CATEGORIES, values)}
					disabled={!categoryOptions.length}
				/>
				<ClassificationToolbarSeparator />
				<Tooltip
					content={hasFilters ? 'Reset all filters' : 'No filters to reset'}
				>
					<ButtonTw
						variant="secondary"
						size="xss"
						disabled={!hasFilters}
						onClick={resetFilters}
						data-testid="run-issues-reset-filters"
					>
						<Icon name="Bin" size={18} className="mr-1.5" />
						Reset
					</ButtonTw>
				</Tooltip>
				{toolbarActions ? (
					<>
						<ClassificationToolbarSeparator />
						{toolbarActions}
					</>
				) : null}
				<div className="ml-auto">
					<ColumnsVisibility
						items={columnVisibilityItems(table)}
						onColumnToggle={(id, checked) =>
							table.getColumn(id)?.toggleVisibility(checked)
						}
					/>
				</div>
			</ClassificationToolbar>

			<div ref={scrollRef} className="flex-1 min-h-0 overflow-auto">
				{rows.length === 0 ? (
					<BublikEmptyState
						title="No matching issues"
						description="No issue in this run matches the current filters."
						className="h-64"
					/>
				) : (
					<ClassificationTable
						table={table}
						stickyHeader
						testId="run-issues-table"
						getRowAttributes={(row) => ({
							'data-testid': 'run-issue-row',
							'data-issue-id': row.original.issue_id,
							'data-issue-state': row.original.state
						})}
						renderSubRow={(row) => (
							<RunIssueResults
								runId={runId}
								issueId={row.original.issue_id}
								projectId={projectId}
							/>
						)}
					/>
				)}
			</div>

			<ClassificationFooter>
				<span className="text-xs text-text-menu tabular-nums">
					{matchedCount} of {issues.length} issues
				</span>
				<Pagination
					className="ml-auto"
					variant="compact"
					totalCount={matchedCount}
					pageSize={pagination.pageSize}
					currentPage={pagination.pageIndex + 1}
					onPageChange={goToPage}
					onPageSizeChange={(pageSize) => table.setPageSize(pageSize)}
				/>
			</ClassificationFooter>
		</div>
	);
}
