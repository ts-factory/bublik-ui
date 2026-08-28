/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useEffect, useMemo, useRef } from 'react';
import {
	ColumnDef,
	type VisibilityState,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	useReactTable
} from '@tanstack/react-table';

import {
	bublikAPI,
	useGetIssueRulesQuery,
	useGetIssuesQuery
} from '@/services/bublik-api';
import { useProjectSearch, LinkWithProject } from '@/bublik/features/projects';
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
import { formatTimeToDot, formatTimestampToFull } from '@/shared/utils';
import type { Issue, IssueCategory, IssueRule } from '@/shared/types';

import {
	CATEGORY_ORDER,
	ISSUE_RULES_STATE_META,
	categoryMeta,
	issueRulesState,
	issueStateMeta,
	type IssueRulesState
} from './classification-colors';
import {
	BugKeyChip,
	CategoryBadgeList,
	IssueRulesBadge,
	IssueStateBadge
} from './classification-badges';
import {
	ClassificationFooter,
	ClassificationSearch,
	ClassificationTable,
	ClassificationToolbar,
	ClassificationToolbarSeparator,
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

/**
 * Actions lead, the way they do on the run's result table: the controls sit
 * where the eye already starts rather than at the far edge of a wide row.
 *
 * Then identity — key, title, when it appeared — and then the columns that
 * describe it, in the sequence the run's issue table uses for the ones they
 * share, so moving between `/issues` and `/runs/:runId/issues` does not mean
 * re-finding every column. `State` earns its place before the rest because
 * closing an issue deactivates every rule under it, silently overriding the
 * columns that follow; `Rules` sits next to it because they are one mechanism.
 */
const COLUMN_ID = {
	ACTIONS: 'actions',
	KEY: 'key',
	ISSUE: 'issue',
	CREATED: 'created',
	STATE: 'state',
	CATEGORIES: 'categories',
	RULES: 'rules',
	FILLER: 'filler'
} as const;

const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {};

/** Module-level so the URL-state hook's memos do not churn every render. */
const FILTER_KEYS = [
	COLUMN_ID.STATE,
	COLUMN_ID.CATEGORIES,
	COLUMN_ID.RULES
] as const;

const RULES_STATE_ORDER: IssueRulesState[] = [
	'enforced',
	'dormant',
	'deactivated',
	'unruled'
];

/**
 * An issue row plus everything derivable from its rules. `/issues/` returns no
 * category and no rule count, but `/issue_rules/` carries both, so one extra
 * request turns a two-column list into something you can actually triage from.
 */
interface IssueTableRow extends Issue {
	categories: IssueCategory[];
	ruleCount: number;
	activeRuleCount: number;
	rulesState: IssueRulesState;
	bugKey: string | null;
	bugUrl: string | null;
}

function buildRows(issues: Issue[], rules: IssueRule[]): IssueTableRow[] {
	const byIssue = new Map<number, IssueRule[]>();

	for (const rule of rules) {
		const existing = byIssue.get(rule.issue);
		if (existing) existing.push(rule);
		else byIssue.set(rule.issue, [rule]);
	}

	return issues.map((issue) => {
		const issueRules = byIssue.get(issue.id) ?? [];

		// Prefer whatever the row already knows. The client-side join is a
		// stand-in, and a poor one now that rules arrive one page at a time:
		// beyond the first page of `/issue_rules/` it silently under-reports.
		const categories =
			issue.categories ??
			Array.from(new Set(issueRules.map((rule) => rule.category))).sort(
				(a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b)
			);
		const ruleCount = issue.rule_count ?? issueRules.length;
		const activeRuleCount =
			issue.active_rule_count ??
			issueRules.filter((rule) => rule.active).length;

		return {
			...issue,
			categories,
			ruleCount,
			activeRuleCount,
			rulesState: issueRulesState({
				state: issue.state,
				total: ruleCount,
				active: activeRuleCount
			}).value,
			bugKey: issue.issue_ext?.key ?? null,
			// TODO(api): `/issues/` returns no resolved tracker URL, so this is
			// null today and the chip renders without its link. The run-scoped
			// endpoint already resolves it (`run_issues_summary` -> `resolve_ref`);
			// the list endpoint needs the same treatment.
			bugUrl: issue.bug_url ?? null
		};
	});
}

const searchFilter = makeSearchFilter<IssueTableRow>((issue) => [
	issue.title,
	issue.description,
	issue.bugKey,
	`#${issue.id}`
]);

function getColumns(projectId?: number): ColumnDef<IssueTableRow, unknown>[] {
	return [
		{
			// Leftmost and shrunk to its buttons. The run's result table opens the
			// same way, and putting the controls where the eye already starts beats
			// making you track to the far edge of a wide row to reach them.
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
					issueId={row.original.id}
					title={row.original.title}
					state={row.original.state}
					projectId={projectId}
				/>
			)
		},
		{
			// The tracker key starts the data half of every row, and and
			// — once the API resolves `bug_url` — the way out to the tracker sits
			// on that same line, matching the run's issue table. The chip and the
			// link sit at opposite ends of the cell so the links land in one
			// vertical run however short the key is.
			id: COLUMN_ID.KEY,
			accessorFn: (row) => row.bugKey ?? '',
			header: 'Key',
			// `w-px` + `whitespace-nowrap` is the shrink-to-fit idiom under
			// `table-auto`: the declared width is only a floor, so the column
			// collapses to its widest chip and stops stealing slack.
			meta: { className: 'w-px whitespace-nowrap', badgeCell: true },
			enableSorting: false,
			cell: ({ row }) => (
				<BugKeyChip
					bugKey={row.original.bugKey}
					bugUrl={row.original.bugUrl}
					issueId={row.original.id}
					fallback={`#${row.original.id}`}
					className="flex justify-between w-full gap-2"
				/>
			)
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
			cell: ({ row }) => (
				<div className="flex flex-col gap-0.5">
					<Tooltip content={`Manage the rules behind ${row.original.title}`}>
						<LinkWithProject
							to={routes.issue({ issueId: row.original.id })}
							className="block max-w-[25rem] font-medium truncate text-text-primary hover:text-primary hover:underline"
						>
							{row.original.title}
						</LinkWithProject>
					</Tooltip>
					{row.original.description ? (
						<span className="block max-w-[25rem] text-xs truncate text-text-menu">
							{row.original.description}
						</span>
					) : null}
				</div>
			)
		},
		{
			id: COLUMN_ID.CREATED,
			accessorFn: (row) => row.created_at ?? '',
			header: 'Created',
			meta: { className: 'w-px whitespace-nowrap' },
			cell: ({ row }) => {
				const { created_at, closed_at, state } = row.original;

				return (
					<Tooltip
						content={
							state === 'closed' && closed_at
								? `Closed ${formatTimestampToFull(closed_at)}`
								: `Created ${formatTimestampToFull(created_at)}`
						}
					>
						<span className="tabular-nums text-text-primary">
							{formatTimeToDot(created_at)}
						</span>
					</Tooltip>
				);
			}
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
			// Two badges at most in practice, so it is sized to that. It used to
			// carry `min-w-` with no ceiling, which under `table-auto` made it the
			// one column free to absorb every spare pixel in the table.
			id: COLUMN_ID.CATEGORIES,
			accessorFn: (row) => row.categories,
			header: 'Categories',
			meta: { className: 'w-px whitespace-nowrap', badgeCell: true },
			enableSorting: false,
			filterFn: someOfFilter,
			cell: ({ row }) => (
				<CategoryBadgeList categories={row.original.categories} />
			)
		},
		{
			id: COLUMN_ID.RULES,
			accessorFn: (row) => row.rulesState,
			header: 'Rules',
			meta: { className: 'w-36 whitespace-nowrap', badgeCell: true },
			enableSorting: false,
			filterFn: someOfFilter,
			cell: ({ row }) => (
				<IssueRulesBadge
					state={row.original.state}
					total={row.original.ruleCount}
					active={row.original.activeRuleCount}
				/>
			)
		},
		{
			// A `w-full` table has to spend its spare width on *some* column, and on
			// a wide screen that is hundreds of pixels. Without somewhere to put it,
			// `table-auto` shares it out across every column — including the ones
			// declared `w-px` to shrink to their contents, which is why Key and
			// Actions were not staying narrow. This column exists to be empty.
			id: COLUMN_ID.FILLER,
			enableHiding: false,
			header: () => null,
			enableSorting: false,
			cell: () => null
		}
	];
}

function IssuesTableLoading() {
	return (
		<div className="flex flex-col gap-1 p-2">
			{Array.from({ length: 10 }, () => 0).map((_, idx) => (
				<Skeleton key={idx} className="h-12 rounded-md" />
			))}
		</div>
	);
}

/**
 * TODO(api): counted over the current page only, because that is all the table
 * holds once the server owns paging. `getIssuesFacets` is the intended source;
 * until it exists the numbers describe the page, not the project.
 */
function useFacetOptions(rows: IssueTableRow[]) {
	return useMemo(
		() => ({
			stateOptions: buildFacetOptions({
				values: rows.map((row) => row.state),
				order: ['open', 'closed'] as const,
				labelFor: (state) => issueStateMeta(state).label
			}),
			rulesOptions: buildFacetOptions({
				values: rows.map((row) => row.rulesState),
				order: RULES_STATE_ORDER,
				labelFor: (value) => ISSUE_RULES_STATE_META[value].label
			}),
			categoryOptions: buildFacetOptions({
				values: rows.flatMap((row) => row.categories),
				order: CATEGORY_ORDER,
				labelFor: (category) => categoryMeta(category).displayValue
			})
		}),
		[rows]
	);
}

export function IssuesTable() {
	const { projectIds } = useProjectSearch();
	const projectId = projectIds[0];

	// Issues are global; `project` is an optional filter on the backend, so an
	// unscoped request legitimately lists every project. Say which it is.
	const { data: projects } = bublikAPI.useGetAllProjectsQuery();

	const scrollRef = useRef<HTMLDivElement>(null);
	const [columnVisibility, setColumnVisibility] = useColumnVisibility(
		'issues',
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
		clampPage,
		queryArgs
	} = useClassificationTableState({
		filterKeys: FILTER_KEYS,
		searchColumnId: COLUMN_ID.ISSUE,
		// Triage means scanning the whole list, not paging through it. The server
		// caps `page_size` at 10000, so 100 is well inside what it will serve.
		defaultPageSize: 100,
		defaultSorting: [{ id: COLUMN_ID.CREATED, desc: true }]
	});

	const issuesQuery = useGetIssuesQuery({
		projectId,
		page: queryArgs.page,
		pageSize: queryArgs.pageSize,
		search: queryArgs.search,
		ordering: queryArgs.ordering,
		state: queryArgs.filters[COLUMN_ID.STATE],
		category: queryArgs.filters[COLUMN_ID.CATEGORIES],
		rules: queryArgs.filters[COLUMN_ID.RULES]
	});

	// TODO(api): only needed until `/issues/` carries `categories` and the rule
	// counts itself. It is fetched for the same page so the join covers at least
	// the rows on screen, but it cannot be right in general — two independently
	// paginated lists do not line up.
	const rulesQuery = useGetIssueRulesQuery({
		projectId,
		page: queryArgs.page,
		pageSize: queryArgs.pageSize
	});

	const rows = useMemo(
		() =>
			buildRows(
				issuesQuery.data?.results ?? [],
				rulesQuery.data?.results ?? []
			),
		[issuesQuery.data, rulesQuery.data]
	);
	// The count the server reports for the *filtered* set, not the rows in hand.
	// Reading it off the page is what made a 45-issue list say "25 of 25".
	const totalCount = issuesQuery.data?.pagination.count ?? 0;
	const columns = useMemo(() => getColumns(projectId), [projectId]);
	const { stateOptions, rulesOptions, categoryOptions } = useFacetOptions(rows);

	// The server owns paging, filtering and sorting: the table holds one page, so
	// filtering or sorting it locally would only ever reorder that page while
	// claiming to have reordered the list.
	const table = useReactTable({
		data: rows,
		columns,
		state: { columnFilters, sorting, pagination, columnVisibility },
		onColumnVisibilityChange: setColumnVisibility,
		onColumnFiltersChange,
		onSortingChange,
		onPaginationChange,
		rowCount: totalCount,
		manualPagination: true,
		// Filtering and sorting stay client-side, over the page in hand. The API
		// accepts the params (they are sent above) but honours almost none of
		// them yet, so leaving these `true` meant the toolbar did nothing at all
		// — every facet and the search box were inert.
		//
		// Filtering the loaded page is not the same as filtering the list, and at
		// more than one page it will under-report. It is still strictly better
		// than not filtering, and it is forward-compatible: once the API narrows
		// the set itself, the client pass matches everything it is given and
		// quietly becomes a no-op.
		getRowId: (row) => String(row.id),
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel()
	});

	const pageCount = table.getPageCount();

	// A shared link can outlive the rows it pointed at. Client-side pagination
	// does not clamp on its own, so `?page=9` on a four-page table would render
	// nothing at all, with no hint why.
	useEffect(() => clampPage(pageCount), [pageCount, clampPage]);

	const scopeLabel =
		projectId === undefined
			? 'all projects'
			: projects?.find((project) => project.id === projectId)?.name ??
			  `project ${projectId}`;

	const getFilterValue = (columnId: string) =>
		(table.getColumn(columnId)?.getFilterValue() as string[] | undefined) ?? [];

	const setFilterValue = (columnId: string, values: string[] | undefined) =>
		table
			.getColumn(columnId)
			?.setFilterValue(values?.length ? values : undefined);

	const visibleRows = table.getRowModel().rows;
	// Filtering happens locally, so the server's count no longer describes what
	// is on screen once a facet is on.
	const matchedCount = table.getFilteredRowModel().rows.length;
	const isNarrowed = hasFilters || Boolean(search);

	function goToPage(page: number) {
		table.setPageIndex(page - 1);
		scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
	}

	if (issuesQuery.isLoading) return <IssuesTableLoading />;

	if (issuesQuery.error) {
		return <BublikErrorState error={issuesQuery.error} className="h-full" />;
	}

	// Only an unfiltered empty result means "there are no issues". With filters
	// on, the empty state belongs inside the table, next to the controls that
	// caused it.
	if (!totalCount && !hasFilters && !search) {
		return (
			<BublikEmptyState
				title="No issues"
				description={`No issues found in ${scopeLabel}. Issues are created by classifying a failing result.`}
				className="h-full"
			/>
		);
	}

	return (
		<div className="flex flex-col flex-1 min-h-0">
			<ClassificationToolbar>
				<Tooltip content="An issue is the cause identity — what is wrong. Its rules decide which results get stamped with it, and whether those results still count as unexpected.">
					<span className="text-[0.75rem] font-semibold leading-[0.875rem] text-text-primary">
						Issues
					</span>
				</Tooltip>
				<ClassificationToolbarSeparator />
				<ClassificationSearch
					value={search}
					onChange={setSearch}
					placeholder="Search title, description or key"
					testId="issues-search"
					className="min-w-[240px]"
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
					title="Rules"
					size="xss"
					options={rulesOptions}
					value={getFilterValue(COLUMN_ID.RULES)}
					onChange={(values) => setFilterValue(COLUMN_ID.RULES, values)}
					disabled={!rulesOptions.length}
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
						data-testid="issues-reset-filters"
					>
						<Icon name="Bin" size={18} className="mr-1.5" />
						Reset
					</ButtonTw>
				</Tooltip>
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
				{visibleRows.length === 0 ? (
					<BublikEmptyState
						title="No matching issues"
						description="No issue matches the current filters."
						className="h-64"
					/>
				) : (
					<ClassificationTable
						table={table}
						stickyHeader
						testId="issues-table"
						getRowAttributes={(row) => ({
							'data-testid': 'issue-row',
							'data-issue-id': row.original.id,
							'data-issue-state': row.original.state
						})}
					/>
				)}
			</div>

			<ClassificationFooter>
				<span className="text-xs text-text-menu tabular-nums">
					{isNarrowed
						? `${matchedCount} of ${totalCount} issues`
						: `${totalCount} ${totalCount === 1 ? 'issue' : 'issues'}`}
				</span>
				<Pagination
					className="ml-auto"
					variant="compact"
					totalCount={totalCount}
					pageSize={pagination.pageSize}
					currentPage={pagination.pageIndex + 1}
					onPageChange={goToPage}
					onPageSizeChange={(pageSize) => table.setPageSize(pageSize)}
				/>
			</ClassificationFooter>
		</div>
	);
}
