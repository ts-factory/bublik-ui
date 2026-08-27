/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import {
	ColumnDef,
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
	DataTableFacetedFilter,
	Icon,
	Pagination,
	Skeleton,
	Tooltip,
	cn
} from '@/shared/tailwind-ui';
import { BublikEmptyState, BublikErrorState } from '@/bublik/features/ui-state';
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
	ClassificationToolbar
} from './classification-table';
import {
	buildFacetOptions,
	makeSearchFilter,
	someOfFilter
} from './classification-table.utils';
import { useClassificationTableState } from './use-classification-table-state';
import { RunIssueResults } from './run-issue-results';

interface RunIssuesTableProps {
	runId: number | string;
	projectId?: number;
	/** Rendered after the filters — e.g. the run-level Apply Rules action. */
	toolbarActions?: ReactNode;
	/** Rendered at the far end of the toolbar — e.g. the run summary. */
	toolbarSummary?: ReactNode;
}

/**
 * Ordered so the row reads as a sentence: *which* issue, *how much* of the run
 * it accounts for, *what it does* to the unexpected count, and only then the
 * three fields that explain that verdict — the cause, the decision, and the
 * lifecycle flag that can quietly cancel the decision.
 */
const COLUMN_ID = {
	EXPANDER: 'expander',
	ISSUE: 'issue',
	RESULTS: 'result_count',
	EFFECT: 'effect',
	CATEGORIES: 'categories',
	DISPOSITION: 'disposition',
	STATE: 'state'
} as const;

/** Module-level so the URL-state hook's memos do not churn every render. */
const FILTER_KEYS = [
	COLUMN_ID.STATE,
	COLUMN_ID.CATEGORIES,
	COLUMN_ID.EFFECT
] as const;

const searchFilter = makeSearchFilter<RunIssueRow>((issue) => [
	issue.title,
	issue.bug_key,
	`#${issue.issue_id}`
]);

function ExpandButton({
	isExpanded,
	onClick,
	label,
	testId
}: {
	isExpanded: boolean;
	onClick: () => void;
	label: string;
	testId: string;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-expanded={isExpanded}
			aria-label={label}
			className="grid p-1 rounded place-items-center text-text-menu hover:bg-primary-wash hover:text-primary"
			data-testid={testId}
		>
			<Icon
				name="ArrowShortSmall"
				size={18}
				className={cn(
					'transition-transform',
					isExpanded ? 'rotate-0' : '-rotate-90'
				)}
			/>
		</button>
	);
}

function getColumns(): ColumnDef<RunIssueRow, unknown>[] {
	return [
		{
			id: COLUMN_ID.EXPANDER,
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
			// Title and tracker key are one identity, not two columns: the key is
			// absent on most issues and never worth a column of its own.
			id: COLUMN_ID.ISSUE,
			accessorFn: (row) => row.title,
			header: 'Issue',
			filterFn: searchFilter,
			cell: ({ row }) => {
				const { issue_id, title, bug_key, bug_url } = row.original;

				return (
					<div className="flex flex-col gap-0.5">
						<Tooltip content={`Manage the rules behind ${title}`}>
							<LinkWithProject
								to={`/admin/issues/${issue_id}`}
								className="font-medium text-text-primary hover:text-primary hover:underline"
							>
								{title}
							</LinkWithProject>
						</Tooltip>
						<BugKeyChip
							bugKey={bug_key}
							bugUrl={bug_url}
							fallback={`#${issue_id}`}
						/>
					</div>
				);
			}
		},
		{
			id: COLUMN_ID.RESULTS,
			accessorFn: (row) => row.result_count,
			header: 'Results',
			meta: { className: 'w-24' },
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
			id: COLUMN_ID.EFFECT,
			accessorFn: (row) => runIssueEffect(row).value,
			header: 'Effect on run',
			meta: { className: 'w-36' },
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
			meta: { className: 'w-56' },
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
			meta: { className: 'w-28' },
			enableSorting: false,
			cell: ({ row }) => (
				<DispositionBadge
					expected={aggregateExpected(row.original.categories)}
					aggregate
				/>
			)
		},
		{
			id: COLUMN_ID.STATE,
			accessorFn: (row) => row.state,
			header: 'State',
			meta: { className: 'w-24' },
			enableSorting: false,
			filterFn: someOfFilter,
			cell: ({ row }) => <IssueStateBadge state={row.original.state} />
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
	toolbarActions,
	toolbarSummary
}: RunIssuesTableProps) {
	// Run-scoped: an unscoped answer is never the one we want, and projectId
	// arrives a render late (it comes from the run details query).
	const { data, isLoading, error } = useGetRunIssuesQuery(
		projectId === undefined ? skipToken : { runId, projectId }
	);

	const scrollRef = useRef<HTMLDivElement>(null);
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
	const columns = useMemo(() => getColumns(), []);
	const { stateOptions, effectOptions, categoryOptions } =
		useFacetOptions(issues);

	const table = useReactTable({
		data: issues,
		columns,
		state: { columnFilters, sorting, pagination },
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
					title="Category"
					size="xss"
					options={categoryOptions}
					value={getFilterValue(COLUMN_ID.CATEGORIES)}
					onChange={(values) => setFilterValue(COLUMN_ID.CATEGORIES, values)}
					disabled={!categoryOptions.length}
				/>
				<DataTableFacetedFilter
					title="Effect on run"
					size="xss"
					options={effectOptions}
					value={getFilterValue(COLUMN_ID.EFFECT)}
					onChange={(values) => setFilterValue(COLUMN_ID.EFFECT, values)}
					disabled={!effectOptions.length}
				/>
				{hasFilters ? (
					<Tooltip content="Reset all filters">
						<ButtonTw
							variant="secondary"
							size="xss"
							onClick={resetFilters}
							data-testid="run-issues-reset-filters"
						>
							<Icon name="Bin" size={18} className="mr-1.5" />
							Reset
						</ButtonTw>
					</Tooltip>
				) : null}
				{toolbarActions}
				{toolbarSummary ? (
					<div className="flex items-center ml-auto">{toolbarSummary}</div>
				) : null}
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
					variant="bordered"
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
