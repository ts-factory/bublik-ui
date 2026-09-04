/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useEffect, useMemo, type ReactNode } from 'react';

import { useIsScrollbarVisible } from '@/shared/hooks';
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
import { STATUS_STRIPE_COLUMN_META, StatusStripe } from './status-stripe';
import {
	BugKeyChip,
	CategoryBadgeList,
	IssueRulesBadge,
	IssueStateBadge,
	ProjectBadge
} from './classification-badges';
import {
	ClassificationFooter,
	ClassificationRange,
	ClassificationSearch,
	ClassificationTable,
	ClassificationToolbar,
	ClassificationToolbarSeparator,
	columnVisibilityItems,
	useColumnVisibility
} from './classification-table';
import {
	buildFacetOptions,
	facetControls,
	makeSearchFilter,
	openFacetOptions,
	someOfFilter
} from './classification-table.utils';
import { useClassificationTableState } from './use-classification-table-state';
import { DescriptionCell } from './description-cell';
import { ISSUE_ACTIONS_COLUMN_META, IssueStateActions } from './issue-actions';

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
	STATUS: 'status',
	ACTIONS: 'actions',
	KEY: 'key',
	ISSUE: 'issue',
	DESCRIPTION: 'description',
	CREATED: 'created',
	STATE: 'state',
	/**
	 * **Not** `'project'`. A column id is also its URL key
	 * (`useClassificationTableState`), and `project` belongs to the global
	 * project selector, which reads it as a list of ids — a project *name*
	 * written there made every request send `project=NaN`. Same trap, and the
	 * same workaround, as `rule_project` on the rules table.
	 */
	PROJECT: 'issue_project',
	CATEGORIES: 'categories',
	RULES: 'rules'
} as const;

/**
 * `Created` off by default.
 *
 * It is the one column here nobody triages by — a stamp on the issue rather
 * than something that says what to do about it — and on a row already carrying
 * nine other columns it is a track spent on metadata. The sort it feeds is
 * unaffected: the default ordering lives in the URL state, not in the header,
 * so the list is still newest-first with the column off. The columns menu
 * brings it back for anyone who wants the date in the row.
 */
const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
	[COLUMN_ID.CREATED]: false
};

/** Module-level so the URL-state hook's memos do not churn every render. */
const FILTER_KEYS = [
	COLUMN_ID.STATE,
	COLUMN_ID.PROJECT,
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
	/**
	 * Which projects this issue reaches, by name.
	 *
	 * An issue is global — `/issues/` carries no project at all — but a *rule* is
	 * per-project, so where an issue applies is the set of projects its rules
	 * live in. Derived from the same client-side rules join that already supplies
	 * `categories` and the rule counts, and inheriting its limitation: the two
	 * lists paginate independently, so an issue whose rules did not land on the
	 * fetched page shows nothing here.
	 */
	projectNames: string[];
}

function buildRows(
	issues: Issue[],
	rules: IssueRule[],
	projectNames: Map<number, string>
): IssueTableRow[] {
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
		const issueProjects = Array.from(
			new Set(
				issueRules.map(
					(rule) => projectNames.get(rule.project) ?? `Project #${rule.project}`
				)
			)
		).sort((a, b) => a.localeCompare(b));
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
			bugUrl: issue.bug_url ?? null,
			projectNames: issueProjects
		};
	});
}

const searchFilter = makeSearchFilter<IssueTableRow>((issue) => [
	issue.title,
	issue.description,
	issue.bugKey,
	`#${issue.id}`
]);

function getColumns(
	projectId: number | undefined
): ColumnDef<IssueTableRow, unknown>[] {
	return [
		{
			// Whether this issue's rules are actually doing anything, before you
			// read a word of it. `rulesState` folds the two facts that decide it —
			// the issue's state and how many of its rules are active — and it is
			// the pair that traps people: closing an issue deactivates its rules,
			// and reopening it does not switch them back on.
			id: COLUMN_ID.STATUS,
			enableHiding: false,
			enableSorting: false,
			header: () => null,
			meta: STATUS_STRIPE_COLUMN_META,
			cell: ({ row }) => (
				<StatusStripe meta={ISSUE_RULES_STATE_META[row.original.rulesState]} />
			)
		},
		{
			// Leftmost and shrunk to its buttons. The run's result table opens the
			// same way, and putting the controls where the eye already starts beats
			// making you track to the far edge of a wide row to reach them.
			id: COLUMN_ID.ACTIONS,
			enableHiding: false,
			header: 'Actions',
			meta: ISSUE_ACTIONS_COLUMN_META,
			enableSorting: false,
			cell: ({ row }) => (
				<IssueStateActions
					issueId={row.original.id}
					title={row.original.title}
					projectId={projectId}
					issue={row.original}
					showAuthoring
				/>
			)
		},
		{
			// Which projects this issue reaches. The issue itself is global, so
			// this is the set of projects its rules live in — see `projectNames`.
			// It earns a column because two issues can be indistinguishable
			// otherwise, and because a facet needs a column to filter.
			id: COLUMN_ID.PROJECT,
			accessorFn: (row) => row.projectNames,
			header: 'Project',
			meta: { width: 'auto', badgeCell: true },
			enableSorting: false,
			filterFn: someOfFilter,
			// The chip is also the control that filters by it, like every other
			// badge in this table: the value handed to `toggleProps` is one of the
			// values this column's `accessorFn` yields, so the chip and
			// `someOfFilter` cannot disagree.
			cell: ({ row, table }) => {
				const facets = facetControls(table);

				return (
					<div className="flex flex-wrap items-center gap-1">
						{row.original.projectNames.map((name) => (
							<ProjectBadge
								key={name}
								name={name}
								{...facets.toggleProps(COLUMN_ID.PROJECT, name)}
							/>
						))}
					</div>
				);
			}
		},
		{
			// The tracker key starts the data half of every row, and — once the API
			// resolves `bug_url` — the way out to the tracker leads it, matching the
			// run's issue table. The cell shrinks to the chip rather than stretching
			// across the column: the link is what the eye lands on first, so it wants
			// to sit at the cell's own edge, not at the far side of it.
			id: COLUMN_ID.KEY,
			accessorFn: (row) => row.bugKey ?? '',
			header: 'Key',
			// `max-content` is the grid's shrink-to-fit: the track is exactly as
			// wide as the widest chip and no wider.
			meta: { width: 'auto', badgeCell: true },
			enableSorting: false,
			cell: ({ row }) => (
				<BugKeyChip
					bugKey={row.original.bugKey}
					bugUrl={row.original.bugUrl}
					issueId={row.original.id}
					fallback={`#${row.original.id}`}
				/>
			)
		},
		{
			// Ceilinged at 22rem, not flexible. As the table's only `fr` it took
			// every spare pixel on a wide screen, which left a title of five words
			// sprawling across a third of the row.
			//
			// The ceiling works *with* the way CSS Grid sizes tracks rather than
			// against it: §12.6 Maximize Tracks feeds tracks that can still grow
			// before §12.7 Expand Flexible Tracks feeds the `fr` ones. So this
			// column fills to 22rem first and Description, last in the row, takes
			// whatever is left over. Something has to — with no `fr` anywhere the
			// tracks stop short of the container and the cards do not reach the
			// right edge.
			//
			// The title wraps on word boundaries rather than clipping to an
			// ellipsis. It used to be capped and truncated, which read fine on a
			// wide screen and hid most of the title on a laptop — and a title is
			// the thing on this row people actually scan.
			//
			// Every other column is `auto`: as wide as its badge needs and no
			// wider, and — the part that matters on a narrow window — willing to
			// give that width back rather than push the table into horizontal
			// scroll.
			id: COLUMN_ID.ISSUE,
			accessorFn: (row) => row.title,
			header: 'Issue',
			meta: { width: 'minmax(8rem, 22rem)' },
			filterFn: searchFilter,
			cell: ({ row }) => (
				<Tooltip content={`Manage the rules behind ${row.original.title}`}>
					<LinkWithProject
						to={routes.issue({ issueId: row.original.id })}
						className="block min-w-0 font-medium break-words text-text-primary hover:text-primary hover:underline"
					>
						{row.original.title}
					</LinkWithProject>
				</Tooltip>
			)
		},
		{
			id: COLUMN_ID.CREATED,
			accessorFn: (row) => row.created_at ?? '',
			header: 'Created',
			meta: { width: 'auto' },
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
			meta: { width: 'auto', badgeCell: true },
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
			// Two badges at most in practice, so it is sized to that. It used to
			// carry `min-w-` with no ceiling, which under `table-auto` made it the
			// one column free to absorb every spare pixel in the table.
			id: COLUMN_ID.CATEGORIES,
			accessorFn: (row) => row.categories,
			header: 'Categories',
			meta: { width: 'auto', badgeCell: true },
			enableSorting: false,
			filterFn: someOfFilter,
			cell: ({ row, table }) => {
				const facets = facetControls(table);

				return (
					<CategoryBadgeList
						categories={row.original.categories}
						selectedCategories={facets.values(COLUMN_ID.CATEGORIES)}
						onCategoryClick={(category) =>
							facets.toggle(COLUMN_ID.CATEGORIES, category)
						}
					/>
				);
			}
		},
		{
			id: COLUMN_ID.RULES,
			accessorFn: (row) => row.rulesState,
			header: 'Rules',
			meta: { width: 'auto', badgeCell: true },
			enableSorting: false,
			filterFn: someOfFilter,
			cell: ({ row, table }) => (
				<IssueRulesBadge
					state={row.original.state}
					total={row.original.ruleCount}
					active={row.original.activeRuleCount}
					{...facetControls(table).toggleProps(
						COLUMN_ID.RULES,
						row.original.rulesState
					)}
				/>
			)
		},
		{
			// Last, and capped rather than growing.
			//
			// It is its own column rather than a second line under the title —
			// stacked, it was permanently clipped with no way to read the rest and
			// doubled the height of every row. But it is also empty on most issues,
			// so sitting third in the row as the column that absorbed all the spare
			// width, it was a wide band of nothing splitting the identity of the
			// issue from the badges that describe it. At the end, capped, an empty
			// one costs nothing and a full one is still one click from its tooltip.
			id: COLUMN_ID.DESCRIPTION,
			accessorFn: (row) => row.description ?? '',
			header: 'Description',
			// The table's one flexible track, and the reason it can be: it is last,
			// so the spare width of a wide screen pools at the end of the row
			// instead of pushing the columns that carry badges apart. An empty
			// description is then just the trailing edge of the card, and a long
			// one has the whole of that space to wrap into.
			meta: { width: 'minmax(0, 1fr)' },
			enableSorting: false,
			cell: ({ row }) => <DescriptionCell value={row.original.description} />
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
			}),
			// Open-ended: the projects come from the data, so they are listed
			// alphabetically rather than in a fixed meaning-carrying order.
			projectOptions: openFacetOptions(
				rows.flatMap((row) => row.projectNames)
			)
		}),
		[rows]
	);
}

export interface IssuesTableProps {
	/** Toolbar slot, as `RunIssuesTable` has. Carries the New issue button. */
	toolbarActions?: ReactNode;
}

export function IssuesTable({ toolbarActions }: IssuesTableProps = {}) {
	const { projectIds } = useProjectSearch();
	const projectId = projectIds[0];

	// Issues are global; `project` is an optional filter on the backend, so an
	// unscoped request legitimately lists every project. Say which it is.
	const { data: projects } = bublikAPI.useGetAllProjectsQuery();

	// The same ref serves three jobs: scroll-to-top on paging, the shadow under
	// the pinned header, and the shadow over the footer.
	const [scrollRef, isScrollable] = useIsScrollbarVisible<HTMLDivElement>();
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

	// A rule carries `project` as a bare id, and an id is not something anyone
	// recognises a project by.
	const projectNames = useMemo(
		() => new Map((projects ?? []).map((project) => [project.id, project.name])),
		[projects]
	);

	const rows = useMemo(
		() =>
			buildRows(
				issuesQuery.data?.results ?? [],
				rulesQuery.data?.results ?? [],
				projectNames
			),
		[issuesQuery.data, rulesQuery.data, projectNames]
	);
	// The count the server reports for the *filtered* set, not the rows in hand.
	// Reading it off the page is what made a 45-issue list say "25 of 25".
	const totalCount = issuesQuery.data?.pagination.count ?? 0;
	const columns = useMemo(() => getColumns(projectId), [projectId]);
	const { stateOptions, rulesOptions, categoryOptions, projectOptions } =
		useFacetOptions(rows);

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

	// The same controls the row chips write through, so the dropdowns and the
	// badges are two views of one filter rather than two filters.
	const facets = facetControls(table);

	const visibleRows = table.getRowModel().rows;
	// Filtering happens locally, so the server's count no longer describes what
	// is on screen once a facet is on.
	const matchedCount = table.getFilteredRowModel().rows.length;

	// Both of these change which rows are on screen, so both return the reader
	// to the top of the list.
	function goToPage(page: number) {
		table.setPageIndex(page - 1);
		scrollToTop();
	}

	function setPageSize(pageSize: number) {
		table.setPageSize(pageSize);
		scrollToTop();
	}

	function scrollToTop() {
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
				description={`No issues found in ${scopeLabel}. Record one here, or classify a failing result and one is recorded for you.`}
				className="h-full"
			>
				{toolbarActions}
			</BublikEmptyState>
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
				{/* First of the facets, because it is the widest cut: it decides
				    which project's classifier is in play at all, and the others
				    narrow within that. */}
				<DataTableFacetedFilter
					title="Project"
					size="xss"
					options={projectOptions}
					value={facets.values(COLUMN_ID.PROJECT)}
					onChange={(values) => facets.set(COLUMN_ID.PROJECT, values)}
					disabled={!projectOptions.length}
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
					title="Category"
					size="xss"
					options={categoryOptions}
					value={facets.values(COLUMN_ID.CATEGORIES)}
					onChange={(values) => facets.set(COLUMN_ID.CATEGORIES, values)}
					disabled={!categoryOptions.length}
				/>
				<DataTableFacetedFilter
					title="Rules"
					size="xss"
					options={rulesOptions}
					value={facets.values(COLUMN_ID.RULES)}
					onChange={(values) => facets.set(COLUMN_ID.RULES, values)}
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
				{/* The two controls that act on the table rather than on what it is
				    showing, grouped at the trailing edge behind their own rule. */}
				<div className="flex items-center gap-2 ml-auto">
					{toolbarActions ? (
						<>
							{toolbarActions}
							<ClassificationToolbarSeparator />
						</>
					) : null}
					<ColumnsVisibility
						items={columnVisibilityItems(table)}
						onColumnToggle={(id, checked) =>
							table.getColumn(id)?.toggleVisibility(checked)
						}
					/>
				</div>
			</ClassificationToolbar>

			{/* Grey, because the rows are white cards and a card needs something to
			    sit on. The toolbar and footer paint their own white. */}
			<div ref={scrollRef} className="flex-1 min-h-0 overflow-auto bg-bg-body">
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
						scrollRef={scrollRef}
						testId="issues-table"
						getRowAttributes={(row) => ({
							'data-testid': 'issue-row',
							'data-issue-id': row.original.id,
							'data-issue-state': row.original.state
						})}
					/>
				)}
			</div>

			<ClassificationFooter isScrollable={isScrollable}>
				<ClassificationRange
					matchedCount={matchedCount}
					totalCount={matchedCount}
					pageIndex={pagination.pageIndex}
					pageSize={pagination.pageSize}
					noun="issue"
				/>
				<Pagination
					className="ml-auto"
					variant="compact"
					totalCount={totalCount}
					pageSize={pagination.pageSize}
					currentPage={pagination.pageIndex + 1}
					onPageChange={goToPage}
					onPageSizeChange={setPageSize}
				/>
			</ClassificationFooter>
		</div>
	);
}
