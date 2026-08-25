/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useMemo, useState } from 'react';
import {
	ColumnDef,
	ColumnFiltersState,
	FilterFn,
	SortingState,
	getCoreRowModel,
	getFilteredRowModel,
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
	Badge,
	ButtonTw,
	DataTableFacetedFilter,
	Icon,
	Input,
	Skeleton,
	Tooltip,
	cn,
	toast
} from '@/shared/tailwind-ui';
import { BublikEmptyState, BublikErrorState } from '@/bublik/features/ui-state';
import { formatTimeToDot, formatTimestampToFull } from '@/shared/utils';
import type { Issue, IssueCategory, IssueRule } from '@/shared/types';

import {
	CATEGORY_ORDER,
	CLASSIFICATION_BADGE_CLASS,
	ISSUE_RULES_STATE_META,
	type IssueRulesState,
	categoryMeta,
	formatBugKey,
	issueRulesState,
	issueStateMeta
} from './classification-colors';
import {
	ClassificationTable,
	ClassificationToolbar
} from './classification-table';

const COLUMN_ID = {
	ISSUE: 'issue',
	STATE: 'state',
	CATEGORIES: 'categories',
	RULES: 'rules',
	CREATED: 'created',
	ACTIONS: 'actions'
} as const;

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

/** Matches when the row carries *any* of the selected values. */
const someOfFilter: FilterFn<IssueTableRow> = (row, columnId, filterValue) => {
	const selected = filterValue as string[] | undefined;
	if (!selected?.length) return true;

	const value = row.getValue(columnId);
	const values = Array.isArray(value) ? value : [value];

	return values.some((v) => selected.includes(String(v)));
};

const searchFilter: FilterFn<IssueTableRow> = (row, _columnId, filterValue) => {
	const query = String(filterValue ?? '')
		.trim()
		.toLowerCase();
	if (!query) return true;

	const issue = row.original;
	const haystack = [
		issue.title,
		issue.description,
		issue.bugKey,
		`#${issue.id}`
	]
		.filter(Boolean)
		.join(' ')
		.toLowerCase();

	return haystack.includes(query);
};

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
				<LinkWithProject to={`/admin/issues/${issue.id}`}>
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
			id: COLUMN_ID.ISSUE,
			accessorFn: (row) => row.title,
			header: () => (
				<span className="inline-flex items-center gap-1">
					<Icon name="TriangleExclamationMark" size={14} />
					Issue
				</span>
			),
			filterFn: searchFilter,
			cell: ({ row }) => (
				<div className="flex flex-col gap-0.5">
					<div className="flex items-center gap-2">
						<LinkWithProject
							to={`/admin/issues/${row.original.id}`}
							className="font-medium text-text-primary hover:text-primary hover:underline"
						>
							{row.original.title}
						</LinkWithProject>
						{row.original.bugKey ? (
							<Tooltip content={row.original.bugKey}>
								<span className="px-1.5 rounded bg-badge-0 text-[0.6875rem] leading-[1.125rem] text-text-menu">
									{formatBugKey(row.original.bugKey)}
								</span>
							</Tooltip>
						) : null}
					</div>
					{row.original.description ? (
						<span className="text-xs truncate text-text-menu">
							{row.original.description}
						</span>
					) : null}
				</div>
			)
		},
		{
			id: COLUMN_ID.STATE,
			accessorFn: (row) => row.state,
			header: 'State',
			meta: { className: 'w-28' },
			enableSorting: false,
			filterFn: someOfFilter,
			cell: ({ row }) => {
				const meta = issueStateMeta(row.original.state);

				return (
					<Tooltip content={meta.description}>
						<Badge className={cn(CLASSIFICATION_BADGE_CLASS, meta.className)}>
							{meta.label}
						</Badge>
					</Tooltip>
				);
			}
		},
		{
			id: COLUMN_ID.CATEGORIES,
			accessorFn: (row) => row.categories,
			header: 'Categories',
			meta: { className: 'w-64' },
			enableSorting: false,
			filterFn: someOfFilter,
			cell: ({ row }) => {
				if (!row.original.categories.length) {
					return <span className="text-text-menu">-</span>;
				}

				return (
					<div className="flex flex-wrap items-center gap-1">
						{row.original.categories.map((category) => {
							const meta = categoryMeta(category);

							return (
								<Tooltip key={category} content={meta.description}>
									<Badge
										className={cn(CLASSIFICATION_BADGE_CLASS, meta.className)}
										data-category={category}
									>
										{meta.label}
									</Badge>
								</Tooltip>
							);
						})}
					</div>
				);
			}
		},
		{
			id: COLUMN_ID.RULES,
			accessorFn: (row) => row.rulesState,
			header: 'Rules',
			meta: { className: 'w-52' },
			enableSorting: false,
			filterFn: someOfFilter,
			cell: ({ row }) => {
				const meta = ISSUE_RULES_STATE_META[row.original.rulesState];
				const { activeRuleCount, ruleCount } = row.original;

				return (
					<Tooltip content={meta.description}>
						<Badge
							className={cn(CLASSIFICATION_BADGE_CLASS, meta.className)}
							data-rules-state={meta.value}
						>
							{ruleCount === 0
								? meta.label
								: `${activeRuleCount} of ${ruleCount} active`}
						</Badge>
					</Tooltip>
				);
			}
		},
		{
			id: COLUMN_ID.CREATED,
			accessorFn: (row) => row.created_at ?? '',
			header: 'Created',
			meta: { className: 'w-32' },
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
			id: COLUMN_ID.ACTIONS,
			header: () => <span className="sr-only">Actions</span>,
			meta: { className: 'w-44' },
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

interface FacetOption {
	label: string;
	value: string;
}

function useFacetOptions(rows: IssueTableRow[]) {
	return useMemo(() => {
		const countBy = (values: string[]) =>
			values.reduce<Record<string, number>>((acc, value) => {
				acc[value] = (acc[value] ?? 0) + 1;
				return acc;
			}, {});

		const stateCounts = countBy(rows.map((row) => row.state));
		const rulesCounts = countBy(rows.map((row) => row.rulesState));
		const categoryCounts = countBy(rows.flatMap((row) => row.categories));

		const stateOptions: FacetOption[] = (['open', 'closed'] as const)
			.filter((state) => stateCounts[state])
			.map((state) => ({
				value: state,
				label: `${issueStateMeta(state).label} (${stateCounts[state]})`
			}));

		const rulesOptions: FacetOption[] = RULES_STATE_ORDER.filter(
			(value) => rulesCounts[value]
		).map((value) => ({
			value,
			label: `${ISSUE_RULES_STATE_META[value].label} (${rulesCounts[value]})`
		}));

		const categoryOptions: FacetOption[] = CATEGORY_ORDER.filter(
			(category) => categoryCounts[category]
		).map((category) => ({
			value: category,
			label: `${categoryMeta(category).label} (${categoryCounts[category]})`
		}));

		return { stateOptions, rulesOptions, categoryOptions };
	}, [rows]);
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

	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [sorting, setSorting] = useState<SortingState>([
		{ id: COLUMN_ID.CREATED, desc: true }
	]);

	const rows = useMemo(
		() => buildRows(issuesQuery.data ?? [], rulesQuery.data ?? []),
		[issuesQuery.data, rulesQuery.data]
	);
	const columns = useMemo(() => getColumns(projectId), [projectId]);
	const { stateOptions, rulesOptions, categoryOptions } = useFacetOptions(rows);

	const table = useReactTable({
		data: rows,
		columns,
		state: { columnFilters, sorting },
		onColumnFiltersChange: setColumnFilters,
		onSortingChange: setSorting,
		getRowId: (row) => String(row.id),
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel()
	});

	const scopeLabel =
		projectId === undefined
			? 'all projects'
			: projects?.find((project) => project.id === projectId)?.name ??
			  `project ${projectId}`;

	const getFilterValue = (columnId: string) =>
		(table.getColumn(columnId)?.getFilterValue() as string[] | undefined) ?? [];

	const search =
		(table.getColumn(COLUMN_ID.ISSUE)?.getFilterValue() as
			| string
			| undefined) ?? '';

	const hasFilters = columnFilters.length > 0;
	const visibleRows = table.getRowModel().rows;

	if (issuesQuery.isLoading || rulesQuery.isLoading) {
		return <IssuesTableLoading />;
	}

	if (issuesQuery.error) {
		return (
			<BublikErrorState
				error={issuesQuery.error}
				className="h-[calc(100vh-256px)]"
			/>
		);
	}

	if (!rows.length) {
		return (
			<BublikEmptyState
				title="No issues"
				description={`No issues found in ${scopeLabel}. Issues are created by classifying a failing result.`}
				className="h-[calc(100vh-256px)]"
			/>
		);
	}

	return (
		<div className="flex flex-col">
			<ClassificationToolbar>
				<Input
					type="text"
					placeholder="Search title, description or key"
					className="h-7 min-w-[240px] text-xs"
					value={search}
					onChange={(event) =>
						table
							.getColumn(COLUMN_ID.ISSUE)
							?.setFilterValue(event.target.value || undefined)
					}
					data-testid="issues-search"
				/>
				<DataTableFacetedFilter
					title="State"
					size="xss"
					options={stateOptions}
					value={getFilterValue(COLUMN_ID.STATE)}
					onChange={(values) =>
						table
							.getColumn(COLUMN_ID.STATE)
							?.setFilterValue(values?.length ? values : undefined)
					}
					disabled={!stateOptions.length}
				/>
				<DataTableFacetedFilter
					title="Category"
					size="xss"
					options={categoryOptions}
					value={getFilterValue(COLUMN_ID.CATEGORIES)}
					onChange={(values) =>
						table
							.getColumn(COLUMN_ID.CATEGORIES)
							?.setFilterValue(values?.length ? values : undefined)
					}
					disabled={!categoryOptions.length}
				/>
				<DataTableFacetedFilter
					title="Rules"
					size="xss"
					options={rulesOptions}
					value={getFilterValue(COLUMN_ID.RULES)}
					onChange={(values) =>
						table
							.getColumn(COLUMN_ID.RULES)
							?.setFilterValue(values?.length ? values : undefined)
					}
					disabled={!rulesOptions.length}
				/>
				{hasFilters ? (
					<Tooltip content="Reset all filters">
						<ButtonTw
							variant="secondary"
							size="xss"
							onClick={() => table.resetColumnFilters()}
							data-testid="issues-reset-filters"
						>
							<Icon name="Bin" size={18} className="mr-1.5" />
							Reset
						</ButtonTw>
					</Tooltip>
				) : null}
				<span className="ml-auto text-xs text-text-menu tabular-nums">
					{visibleRows.length} of {rows.length} in {scopeLabel}
				</span>
			</ClassificationToolbar>

			{visibleRows.length === 0 ? (
				<BublikEmptyState
					title="No matching issues"
					description="No issue matches the current filters."
					className="h-64"
				/>
			) : (
				<div className="overflow-x-auto">
					<ClassificationTable
						table={table}
						testId="issues-table"
						getRowAttributes={(row) => ({
							'data-testid': 'issue-row',
							'data-issue-id': row.original.id,
							'data-issue-state': row.original.state
						})}
					/>
				</div>
			)}
		</div>
	);
}
