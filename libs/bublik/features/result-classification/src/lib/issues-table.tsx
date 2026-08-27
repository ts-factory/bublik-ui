/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useEffect, useMemo, useRef } from 'react';
import {
	ColumnDef,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable
} from '@tanstack/react-table';

import {
	bublikAPI,
	getErrorMessage,
	useCloseIssueMutation,
	useGetIssueRulesQuery,
	useGetIssuesQuery,
	useReopenIssueMutation
} from '@/services/bublik-api';
import { useProjectSearch, LinkWithProject } from '@/bublik/features/projects';
import {
	ButtonTw,
	DataTableFacetedFilter,
	Icon,
	Pagination,
	Skeleton,
	Tooltip,
	toast
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
	ClassificationToolbar
} from './classification-table';
import {
	buildFacetOptions,
	makeSearchFilter,
	someOfFilter
} from './classification-table.utils';
import { useClassificationTableState } from './use-classification-table-state';

/**
 * Ordered so the row reads left to right as one sentence: *which* issue — the
 * tracker key, then the title — *why* it is wrong, *whether it still bites*,
 * *how much machinery* is behind it, *when* it appeared, and finally what you
 * can do to it.
 *
 * `Categories` sits directly after the title because the two answer the same
 * question, and `State`/`Rules` are kept adjacent because they are one
 * mechanism: closing an issue deactivates its rules. `Created` is second to
 * last — a date is reference material, not something anyone triages on — and
 * the actions are pinned to the right edge, out of the reading path.
 */
const COLUMN_ID = {
	KEY: 'key',
	ISSUE: 'issue',
	CATEGORIES: 'categories',
	STATE: 'state',
	RULES: 'rules',
	CREATED: 'created',
	ACTIONS: 'actions'
} as const;

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
		const activeRuleCount = issueRules.filter((rule) => rule.active).length;

		return {
			...issue,
			categories: Array.from(
				new Set(issueRules.map((rule) => rule.category))
			).sort((a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b)),
			ruleCount: issueRules.length,
			activeRuleCount,
			rulesState: issueRulesState({
				state: issue.state,
				total: issueRules.length,
				active: activeRuleCount
			}).value,
			bugKey: issue.issue_ext?.key ?? null
		};
	});
}

const searchFilter = makeSearchFilter<IssueTableRow>((issue) => [
	issue.title,
	issue.description,
	issue.bugKey,
	`#${issue.id}`
]);

function notifyError(err: unknown) {
	const m = getErrorMessage(err);
	return `${m.title}\n${m.description}`;
}

interface IssueStateActionsProps {
	issue: IssueTableRow;
	projectId?: number;
}

function IssueStateActions({ issue, projectId }: IssueStateActionsProps) {
	const [closeIssue, closeState] = useCloseIssueMutation();
	const [reopenIssue, reopenState] = useReopenIssueMutation();

	const isOpen = issue.state === 'open';
	const isBusy = closeState.isLoading || reopenState.isLoading;

	function handleToggle() {
		const action = isOpen ? closeIssue : reopenIssue;
		const promise = action({ issueId: issue.id, projectId }).unwrap();

		toast.promise(promise, {
			loading: isOpen ? 'Closing issue...' : 'Reopening issue...',
			success: isOpen ? 'Issue closed' : 'Issue reopened',
			error: notifyError,
			position: 'top-center'
		});
	}

	return (
		<div className="flex items-center justify-end gap-2">
			<ButtonTw asChild variant="secondary" size="xss">
				<LinkWithProject to={routes.issue({ issueId: issue.id })}>
					<Icon name="Paper" size={14} className="mr-1.5" />
					Rules
				</LinkWithProject>
			</ButtonTw>
			<Tooltip
				content={
					isOpen
						? 'Closing also deactivates every active rule, and un-suppresses every result they were hiding.'
						: 'Reopening clears the closed state but does not re-activate the rules.'
				}
			>
				<ButtonTw
					variant={isOpen ? 'destruction-secondary' : 'secondary'}
					size="xss"
					state={isBusy ? 'loading' : 'default'}
					onClick={handleToggle}
					data-testid={isOpen ? 'issue-close' : 'issue-reopen'}
				>
					{isOpen ? 'Close' : 'Reopen'}
				</ButtonTw>
			</Tooltip>
		</div>
	);
}

function getColumns(projectId?: number): ColumnDef<IssueTableRow, unknown>[] {
	return [
		{
			// Leftmost so the tracker key starts every row in the same place.
			// `/issues/` carries no resolved tracker URL — only `issue_ext.key` —
			// so this chip is deliberately link-less; the row's own link is the
			// title beside it.
			id: COLUMN_ID.KEY,
			accessorFn: (row) => row.bugKey ?? '',
			header: 'Key',
			// `w-px` + `whitespace-nowrap` is the shrink-to-fit idiom under
			// `table-auto`: the declared width is only a floor, so the column
			// collapses to its widest chip and stops stealing slack.
			meta: { className: 'w-px whitespace-nowrap' },
			enableSorting: false,
			cell: ({ row }) => (
				<BugKeyChip
					bugKey={row.original.bugKey}
					fallback={`#${row.original.id}`}
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
			// Two badges at most in practice, so it is sized to that. It used to
			// carry `min-w-` with no ceiling, which under `table-auto` made it the
			// one column free to absorb every spare pixel in the table.
			id: COLUMN_ID.CATEGORIES,
			accessorFn: (row) => row.categories,
			header: 'Categories',
			meta: { className: 'w-52' },
			enableSorting: false,
			filterFn: someOfFilter,
			cell: ({ row }) => (
				<CategoryBadgeList categories={row.original.categories} />
			)
		},
		{
			id: COLUMN_ID.STATE,
			accessorFn: (row) => row.state,
			header: 'State',
			meta: { className: 'w-24 whitespace-nowrap' },
			enableSorting: false,
			filterFn: someOfFilter,
			cell: ({ row }) => <IssueStateBadge state={row.original.state} />
		},
		{
			id: COLUMN_ID.RULES,
			accessorFn: (row) => row.rulesState,
			header: 'Rules',
			meta: { className: 'w-36 whitespace-nowrap' },
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
			id: COLUMN_ID.CREATED,
			accessorFn: (row) => row.created_at ?? '',
			header: 'Created',
			meta: { className: 'w-28 whitespace-nowrap' },
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
						<span className="text-text-menu tabular-nums">
							{formatTimeToDot(created_at)}
						</span>
					</Tooltip>
				);
			}
		},
		{
			// Pinned to the right edge and shrunk to its buttons: "Rules" (the way
			// into this issue's rule list) and the lifecycle toggle both live here,
			// so every control on the page sits in one column instead of being
			// split between the title link and the row end.
			id: COLUMN_ID.ACTIONS,
			header: 'Actions',
			meta: { className: 'w-px whitespace-nowrap' },
			enableSorting: false,
			cell: ({ row }) => (
				<IssueStateActions issue={row.original} projectId={projectId} />
			)
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

	const issuesQuery = useGetIssuesQuery(projectId ? { projectId } : {});
	// `/issues/` carries neither category nor rule counts; `/issue_rules/` has
	// both, and this page is the one place worth the second request for them.
	const rulesQuery = useGetIssueRulesQuery(projectId ? { projectId } : {});

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
		defaultSorting: [{ id: COLUMN_ID.CREATED, desc: true }]
	});

	const rows = useMemo(
		() => buildRows(issuesQuery.data?.results ?? [], rulesQuery.data?.results ?? []),
		[issuesQuery.data, rulesQuery.data]
	);
	const columns = useMemo(() => getColumns(projectId), [projectId]);
	const { stateOptions, rulesOptions, categoryOptions } = useFacetOptions(rows);

	const table = useReactTable({
		data: rows,
		columns,
		state: { columnFilters, sorting, pagination },
		onColumnFiltersChange,
		onSortingChange,
		onPaginationChange,
		getRowId: (row) => String(row.id),
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel()
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
	const matchedCount = table.getFilteredRowModel().rows.length;

	function goToPage(page: number) {
		table.setPageIndex(page - 1);
		scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
	}

	if (issuesQuery.isLoading || rulesQuery.isLoading) {
		return <IssuesTableLoading />;
	}

	if (issuesQuery.error) {
		return <BublikErrorState error={issuesQuery.error} className="h-full" />;
	}

	if (!rows.length) {
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
				{hasFilters ? (
					<Tooltip content="Reset all filters">
						<ButtonTw
							variant="secondary"
							size="xss"
							onClick={resetFilters}
							data-testid="issues-reset-filters"
						>
							<Icon name="Bin" size={18} className="mr-1.5" />
							Reset
						</ButtonTw>
					</Tooltip>
				) : null}
				<span className="ml-auto text-xs text-text-menu tabular-nums">
					{matchedCount} of {rows.length} in {scopeLabel}
				</span>
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
					{matchedCount} of {rows.length} issues
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
