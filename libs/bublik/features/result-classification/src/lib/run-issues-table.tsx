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

import { useGetIssuesQuery, useGetRunIssuesQuery } from '@/services/bublik-api';
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
import type { Issue, IssueCategory, RunIssueRow } from '@/shared/types';

import {
	CATEGORY_ORDER,
	EFFECT_ORDER,
	RUN_ISSUE_EFFECT_META,
	categoryMeta,
	issueStateMeta,
	runIssueEffect
} from './classification-colors';
import { FILLER_MIN_WIDTH, useFillerVisible } from './classification-layout';
import { STATUS_STRIPE_COLUMN_META, StatusStripe } from './status-stripe';
import {
	BugKeyChip,
	CategoryBadgeList,
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
	facetControls,
	makeSearchFilter,
	someOfFilter
} from './classification-table.utils';
import { useClassificationTableState } from './use-classification-table-state';
import { DescriptionCell } from './description-cell';
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
 * *what it does* to the unexpected count, and only then the cause behind that.
 *
 * State sits that early because it outranks everything after it: closing an
 * issue deactivates its rules and un-suppresses every result they were hiding.
 * Effect On Run already accounts for that — it reads "counting again" on a
 * closed issue whose rules would otherwise suppress.
 */
const COLUMN_ID = {
	STATUS: 'status',
	EXPANDER: 'expander',
	ACTIONS: 'actions',
	BUG_KEY: 'bug_key',
	ISSUE: 'issue',
	DESCRIPTION: 'description',
	RESULTS: 'result_count',
	STATE: 'state',
	EFFECT: 'effect',
	CATEGORIES: 'categories',
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
	issue.description,
	issue.bug_key,
	`#${issue.issue_id}`
]);

function getColumns(
	projectId: number | undefined,
	/** Hands the spare width to the title when the filler has stood down. */
	growIssue: boolean,
	/** The full issue behind each row, so Edit opens without a second fetch. */
	issueById: Map<number, Issue>
): ColumnDef<RunIssueRow, unknown>[] {
	return [
		{
			// The one question this page exists to answer — does this issue still
			// count against the run — put where you can read a screenful of rows
			// by looking down a single edge. The Effect column says the same thing
			// in words further along the row; this is the same value, same hue.
			id: COLUMN_ID.STATUS,
			enableHiding: false,
			enableSorting: false,
			header: () => null,
			meta: STATUS_STRIPE_COLUMN_META,
			cell: ({ row }) => <StatusStripe meta={runIssueEffect(row.original)} />
		},
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
					// The same controls as `/issues`: an issue met here is the same
					// object, and having to leave the run to fix a title was the kind
					// of detour that makes people not fix it.
					issue={issueById.get(row.original.issue_id)}
					showAuthoring
				/>
			)
		},
		{
			// The external identity, on the same line as the title rather than
			// wrapped under it: when the project resolves one, the link out to the
			// tracker, then the key itself.
			//
			// `w-px` is under min-content, so the column collapses to exactly the
			// widest key it holds — `whitespace-nowrap` keeps that from being
			// measured mid-key, since `E2E-105` would otherwise break at the dash.
			// Inside the cell the link leads the key it opens, and the cell shrinks
			// to the pair rather than stretching them to its two edges.
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
					/>
				);
			}
		},
		{
			// Capped, not flexible: a title is a handful of words, and letting the
			// column soak up every spare pixel pushes the badges off to the edge of
			// the table. Anything longer truncates — the tooltip carries the rest.
			//
			// Narrow enough and the filler stands down (see `useFillerVisible`),
			// and the slack has to land somewhere. It lands here: a title is the
			// one thing on the row that can use more room, and the badge columns
			// are the ones that must not be stretched.
			id: COLUMN_ID.ISSUE,
			accessorFn: (row) => row.title,
			header: 'Issue',
			meta: { className: growIssue ? 'w-full' : 'w-[26rem]' },
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
			// Sits after the title in both issue tables, so moving between
			// `/issues` and a run's issues does not mean re-finding it.
			id: COLUMN_ID.DESCRIPTION,
			accessorFn: (row) => row.description ?? '',
			header: 'Description',
			meta: { className: 'w-[22rem]' },
			enableSorting: false,
			cell: ({ row }) => <DescriptionCell value={row.original.description} />
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
			// Every badge below is also the control that filters by it: the value
			// handed to `toggleProps` is the one this column's `accessorFn` yields,
			// so the chip and `someOfFilter` cannot disagree.
			cell: ({ row, table }) => (
				<IssueStateBadge
					state={row.original.state}
					{...facetControls(table).toggleProps(
						COLUMN_ID.STATE,
						row.original.state
					)}
				/>
			)
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
			cell: ({ row, table }) => {
				const effect = runIssueEffect(row.original).value;

				return (
					<RunEffectBadge
						effect={effect}
						{...facetControls(table).toggleProps(COLUMN_ID.EFFECT, effect)}
					/>
				);
			}
		},
		{
			id: COLUMN_ID.CATEGORIES,
			accessorFn: (row) => row.categories.map((c) => c.category),
			header: 'Categories',
			meta: { className: 'w-px whitespace-nowrap', badgeCell: true },
			enableSorting: false,
			filterFn: someOfFilter,
			cell: ({ row, table }) => {
				const facets = facetControls(table);

				return (
					<CategoryBadgeList
						categories={row.original.categories.map((c) => c.category)}
						selectedCategories={facets.values(COLUMN_ID.CATEGORIES)}
						onCategoryClick={(category) =>
							facets.toggle(COLUMN_ID.CATEGORIES, category)
						}
					/>
				);
			}
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
				// The long form: a dropdown has the room, and AGAIN on its own is a
				// word rather than an answer.
				labelFor: (effect) => RUN_ISSUE_EFFECT_META[effect].displayValue
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

	// TODO(api): only needed for the description and for the row the edit form
	// starts from, neither of which `run_issues_summary` returns. Unlike the
	// same-page joins elsewhere in this feature this one is sound rather than
	// approximate — `/runs/{id}/issues/` is unpaginated and a run holds a
	// handful of issues, so a single large page covers every id it can name.
	// Adding `description` to that endpoint makes it dead code.
	const { data: allIssues } = useGetIssuesQuery(
		projectId === undefined ? skipToken : { projectId, page: 1, pageSize: 1000 }
	);

	const issueById = useMemo(
		() => new Map((allIssues?.results ?? []).map((issue) => [issue.id, issue])),
		[allIssues]
	);

	const scrollRef = useRef<HTMLDivElement>(null);
	const [shellRef, showFiller] = useFillerVisible(FILLER_MIN_WIDTH.runIssues);
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

	const issues = useMemo(
		() =>
			(data ?? []).map((row) => ({
				...row,
				description: row.description ?? issueById.get(row.issue_id)?.description
			})),
		[data, issueById]
	);
	const columns = useMemo(
		() => getColumns(projectId, !showFiller, issueById),
		[projectId, showFiller, issueById]
	);

	// The filler is a layout device, not a column anyone chose, so its
	// visibility is decided here rather than stored: it is `enableHiding: false`
	// and never appears in the columns menu.
	const effectiveColumnVisibility = useMemo<VisibilityState>(
		() => ({ ...columnVisibility, [COLUMN_ID.FILLER]: showFiller }),
		[columnVisibility, showFiller]
	);
	const { stateOptions, effectOptions, categoryOptions } =
		useFacetOptions(issues);

	const table = useReactTable({
		data: issues,
		columns,
		state: {
			columnFilters,
			sorting,
			pagination,
			columnVisibility: effectiveColumnVisibility
		},
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

	// The same controls the row chips write through, so the dropdowns and the
	// badges are two views of one filter rather than two filters.
	const facets = facetControls(table);

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
		<div ref={shellRef} className="flex flex-col flex-1 min-h-0">
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
					value={facets.values(COLUMN_ID.STATE)}
					onChange={(values) => facets.set(COLUMN_ID.STATE, values)}
					disabled={!stateOptions.length}
				/>
				<DataTableFacetedFilter
					title="Effect On Run"
					size="xss"
					options={effectOptions}
					value={facets.values(COLUMN_ID.EFFECT)}
					onChange={(values) => facets.set(COLUMN_ID.EFFECT, values)}
					disabled={!effectOptions.length}
				/>
				<DataTableFacetedFilter
					title="Category"
					size="xss"
					options={categoryOptions}
					value={facets.values(COLUMN_ID.CATEGORIES)}
					onChange={(values) => facets.set(COLUMN_ID.CATEGORIES, values)}
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
