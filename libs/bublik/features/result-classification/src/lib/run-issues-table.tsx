/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useMemo, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import {
	ColumnDef,
	ColumnFiltersState,
	FilterFn,
	SortingState,
	getCoreRowModel,
	getExpandedRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	useReactTable
} from '@tanstack/react-table';

import { useGetRunIssuesQuery } from '@/services/bublik-api';
import { LinkWithProject } from '@/bublik/features/projects';
import {
	Badge,
	ButtonTw,
	DataTableFacetedFilter,
	Icon,
	Input,
	Skeleton,
	Tooltip,
	cn
} from '@/shared/tailwind-ui';
import { BublikEmptyState, BublikErrorState } from '@/bublik/features/ui-state';
import type { IssueCategory, RunIssueRow } from '@/shared/types';

import {
	CATEGORY_ORDER,
	CLASSIFICATION_BADGE_CLASS,
	RUN_ISSUE_EFFECT_META,
	type RunIssueEffect,
	aggregateExpected,
	categoryMeta,
	formatBugKey,
	issueStateMeta,
	runIssueEffect
} from './classification-colors';
import {
	ClassificationTable,
	ClassificationToolbar
} from './classification-table';
import { expectedBadge } from './expected';
import { RunIssueResults } from './run-issue-results';

interface RunIssuesTableProps {
	runId: number | string;
	projectId?: number;
}

const COLUMN_ID = {
	EXPANDER: 'expander',
	ISSUE: 'issue',
	TITLE: 'title',
	STATE: 'state',
	CATEGORIES: 'categories',
	DISPOSITION: 'disposition',
	EFFECT: 'effect',
	RESULTS: 'result_count'
} as const;

const EFFECT_ORDER: RunIssueEffect[] = [
	'suppressed',
	'stale',
	'unexpected',
	'marked'
];

/** Matches when the row carries *any* of the selected values. */
const someOfFilter: FilterFn<RunIssueRow> = (row, columnId, filterValue) => {
	const selected = filterValue as string[] | undefined;
	if (!selected?.length) return true;

	const value = row.getValue(columnId);
	const values = Array.isArray(value) ? value : [value];

	return values.some((v) => selected.includes(String(v)));
};

/** Free-text search over the two human-readable identifiers. */
const searchFilter: FilterFn<RunIssueRow> = (row, _columnId, filterValue) => {
	const query = String(filterValue ?? '')
		.trim()
		.toLowerCase();
	if (!query) return true;

	const issue = row.original;
	const haystack = [issue.title, issue.bug_key, `#${issue.issue_id}`]
		.filter(Boolean)
		.join(' ')
		.toLowerCase();

	return haystack.includes(query);
};

interface CategoryChipsProps {
	categories: RunIssueRow['categories'];
}

function CategoryChips({ categories }: CategoryChipsProps) {
	// A result may be stamped by several of the issue's rules, so the same
	// category can legitimately arrive more than once.
	const unique = Array.from(new Set(categories.map((c) => c.category)));

	if (!unique.length) return <span className="text-text-menu">-</span>;

	return (
		<div className="flex flex-wrap items-center gap-1">
			{unique.map((category) => {
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

function getColumns(): ColumnDef<RunIssueRow, unknown>[] {
	return [
		{
			id: COLUMN_ID.EXPANDER,
			header: () => null,
			meta: { className: 'w-9' },
			enableSorting: false,
			cell: ({ row }) => (
				<button
					type="button"
					onClick={row.getToggleExpandedHandler()}
					aria-expanded={row.getIsExpanded()}
					aria-label={
						row.getIsExpanded() ? 'Hide results' : 'Show classified results'
					}
					className="grid p-1 rounded place-items-center text-text-menu hover:bg-primary-wash hover:text-primary"
					data-testid="run-issue-expander"
				>
					<Icon
						name="ArrowShortSmall"
						size={18}
						className={cn(
							'transition-transform',
							row.getIsExpanded() ? 'rotate-0' : '-rotate-90'
						)}
					/>
				</button>
			)
		},
		{
			id: COLUMN_ID.ISSUE,
			accessorFn: (row) => row.bug_key ?? `#${row.issue_id}`,
			header: 'Issue',
			meta: { className: 'w-44' },
			filterFn: searchFilter,
			cell: ({ row }) => {
				const { bug_key, bug_url, issue_id } = row.original;
				const label = formatBugKey(bug_key) ?? `#${issue_id}`;

				return (
					<div className="flex items-center gap-1">
						<Tooltip content={`Manage rules for ${bug_key ?? `#${issue_id}`}`}>
							<LinkWithProject
								to={`/admin/issues/${issue_id}`}
								className="truncate text-text-menu hover:text-primary hover:underline"
							>
								{label}
							</LinkWithProject>
						</Tooltip>
						{bug_url ? (
							<Tooltip content="Open in the issue tracker">
								<a
									href={bug_url}
									target="_blank"
									rel="noreferrer"
									className="grid place-items-center text-text-menu hover:text-primary"
									data-testid="run-issue-bug-link"
								>
									<Icon name="ExternalLink" size={14} />
								</a>
							</Tooltip>
						) : null}
					</div>
				);
			}
		},
		{
			id: COLUMN_ID.TITLE,
			accessorFn: (row) => row.title,
			header: 'Title',
			cell: ({ row }) => (
				<LinkWithProject
					to={`/admin/issues/${row.original.issue_id}`}
					className="font-medium text-text-primary hover:text-primary hover:underline"
				>
					{row.original.title}
				</LinkWithProject>
			)
		},
		{
			id: COLUMN_ID.STATE,
			accessorFn: (row) => row.state,
			header: 'State',
			meta: { className: 'w-24' },
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
			accessorFn: (row) => row.categories.map((c) => c.category),
			header: 'Categories',
			meta: { className: 'w-56' },
			enableSorting: false,
			filterFn: someOfFilter,
			cell: ({ row }) => <CategoryChips categories={row.original.categories} />
		},
		{
			id: COLUMN_ID.DISPOSITION,
			accessorFn: (row) => aggregateExpected(row.categories),
			header: 'Disposition',
			meta: { className: 'w-28' },
			enableSorting: false,
			cell: ({ row }) => {
				const expected = aggregateExpected(row.original.categories);
				const badge = expectedBadge(expected);

				return (
					<Tooltip
						content={
							expected === true
								? 'At least one rule marks these results expected.'
								: expected === false
								? 'The rules say these results are still unexpected.'
								: 'The rules set no disposition, so nothing changes.'
						}
					>
						<Badge
							variant={badge.variant}
							className={CLASSIFICATION_BADGE_CLASS}
						>
							{badge.label}
						</Badge>
					</Tooltip>
				);
			}
		},
		{
			id: COLUMN_ID.EFFECT,
			accessorFn: (row) => runIssueEffect(row).value,
			header: 'Effect on run',
			meta: { className: 'w-36' },
			enableSorting: false,
			filterFn: someOfFilter,
			cell: ({ row }) => {
				const meta = runIssueEffect(row.original);

				return (
					<Tooltip content={meta.description}>
						<Badge
							className={cn(CLASSIFICATION_BADGE_CLASS, meta.className)}
							data-effect={meta.value}
						>
							{meta.label}
						</Badge>
					</Tooltip>
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

interface FacetOption {
	label: string;
	value: string;
}

/** Options carry live counts so an empty facet is obvious before you open it. */
function useFacetOptions(issues: RunIssueRow[]) {
	return useMemo(() => {
		const countBy = <T extends string>(values: T[]) =>
			values.reduce<Record<string, number>>((acc, value) => {
				acc[value] = (acc[value] ?? 0) + 1;
				return acc;
			}, {});

		const stateCounts = countBy(issues.map((issue) => issue.state));
		const effectCounts = countBy(
			issues.map((issue) => runIssueEffect(issue).value)
		);
		const categoryCounts = countBy(
			issues.flatMap((issue) =>
				Array.from(new Set(issue.categories.map((c) => c.category)))
			) as IssueCategory[]
		);

		const stateOptions: FacetOption[] = (['open', 'closed'] as const)
			.filter((state) => stateCounts[state])
			.map((state) => ({
				value: state,
				label: `${issueStateMeta(state).label} (${stateCounts[state]})`
			}));

		const effectOptions: FacetOption[] = EFFECT_ORDER.filter(
			(effect) => effectCounts[effect]
		).map((effect) => ({
			value: effect,
			label: `${RUN_ISSUE_EFFECT_META[effect].label} (${effectCounts[effect]})`
		}));

		const categoryOptions: FacetOption[] = CATEGORY_ORDER.filter(
			(category) => categoryCounts[category]
		).map((category) => ({
			value: category,
			label: `${categoryMeta(category).label} (${categoryCounts[category]})`
		}));

		return { stateOptions, effectOptions, categoryOptions };
	}, [issues]);
}

export function RunIssuesTable({ runId, projectId }: RunIssuesTableProps) {
	// Run-scoped: an unscoped answer is never the one we want, and projectId
	// arrives a render late (it comes from the run details query).
	const { data, isLoading, error } = useGetRunIssuesQuery(
		projectId === undefined ? skipToken : { runId, projectId }
	);

	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [sorting, setSorting] = useState<SortingState>([
		{ id: COLUMN_ID.RESULTS, desc: true }
	]);

	const issues = useMemo(() => data ?? [], [data]);
	const columns = useMemo(() => getColumns(), []);
	const { stateOptions, effectOptions, categoryOptions } =
		useFacetOptions(issues);

	const table = useReactTable({
		data: issues,
		columns,
		state: { columnFilters, sorting },
		onColumnFiltersChange: setColumnFilters,
		onSortingChange: setSorting,
		getRowId: (row) => String(row.issue_id),
		getRowCanExpand: () => true,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getExpandedRowModel: getExpandedRowModel()
	});

	const getFilterValue = (columnId: string) =>
		(table.getColumn(columnId)?.getFilterValue() as string[] | undefined) ?? [];

	const search =
		(table.getColumn(COLUMN_ID.ISSUE)?.getFilterValue() as
			| string
			| undefined) ?? '';

	const hasFilters = columnFilters.length > 0;
	const rows = table.getRowModel().rows;

	// projectId undefined => query skipped, so isLoading is false. Keep the
	// skeleton up rather than flashing the empty state.
	if (isLoading || projectId === undefined) return <RunIssuesTableLoading />;

	if (error) {
		return <BublikErrorState error={error} className="h-[calc(100vh-256px)]" />;
	}

	if (!issues.length) {
		return (
			<BublikEmptyState
				title="No issues"
				description="Nothing in this run is classified yet. Classify a failing result, or apply the active rules to this run."
				className="h-[calc(100vh-256px)]"
			/>
		);
	}

	return (
		<div className="flex flex-col">
			<ClassificationToolbar>
				<Input
					type="text"
					placeholder="Search title or key"
					className="h-7 min-w-[220px] text-xs"
					value={search}
					onChange={(event) =>
						table
							.getColumn(COLUMN_ID.ISSUE)
							?.setFilterValue(event.target.value || undefined)
					}
					data-testid="run-issues-search"
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
					title="Effect on run"
					size="xss"
					options={effectOptions}
					value={getFilterValue(COLUMN_ID.EFFECT)}
					onChange={(values) =>
						table
							.getColumn(COLUMN_ID.EFFECT)
							?.setFilterValue(values?.length ? values : undefined)
					}
					disabled={!effectOptions.length}
				/>
				{hasFilters ? (
					<Tooltip content="Reset all filters">
						<ButtonTw
							variant="secondary"
							size="xss"
							onClick={() => table.resetColumnFilters()}
							data-testid="run-issues-reset-filters"
						>
							<Icon name="Bin" size={18} className="mr-1.5" />
							Reset
						</ButtonTw>
					</Tooltip>
				) : null}
				<span className="ml-auto text-xs text-text-menu tabular-nums">
					{rows.length} of {issues.length} issues
				</span>
			</ClassificationToolbar>

			{rows.length === 0 ? (
				<BublikEmptyState
					title="No matching issues"
					description="No issue in this run matches the current filters."
					className="h-64"
				/>
			) : (
				<div className="overflow-x-auto">
					<ClassificationTable
						table={table}
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
				</div>
			)}
		</div>
	);
}
