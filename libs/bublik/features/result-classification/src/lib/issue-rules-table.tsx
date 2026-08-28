/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useEffect, useMemo, useRef, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import {
	ColumnDef,
	type VisibilityState,
	getCoreRowModel,
	getExpandedRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	useReactTable
} from '@tanstack/react-table';

import {
	getErrorMessage,
	useActivateRuleMutation,
	useDeactivateRuleMutation,
	useGetIssueRulesQuery,
	useGetIssuesQuery
} from '@/services/bublik-api';
import {
	Badge,
	BadgeVariants,
	ButtonTw,
	ColumnsVisibility,
	DataTableFacetedFilter,
	Icon,
	Pagination,
	Separator,
	Skeleton,
	Tooltip,
	cn,
	toast
} from '@/shared/tailwind-ui';
import { BublikEmptyState, BublikErrorState } from '@/bublik/features/ui-state';
import { LinkWithProject } from '@/bublik/features/projects';
import { routes } from '@/router';
import { config } from '@/bublik/config';
import { formatKeyValueForDisplay } from '@/shared/utils';
import type { Issue, IssueRule, IssueState } from '@/shared/types';

import {
	CATEGORY_ORDER,
	DISPOSITION_ORDER,
	DISPOSITION_META,
	categoryMeta,
	dispositionKey,
	formatBugKey,
	issueStateMeta,
	ruleActiveMeta
} from './classification-colors';
import {
	BugKeyChip,
	CategoryBadge,
	DispositionBadge,
	IssueStateBadge,
	RuleActiveBadge
} from './classification-badges';
import {
	ClassificationFooter,
	ClassificationSearch,
	ClassificationTable,
	ClassificationToolbar,
	ClassificationToolbarSeparator,
	ExpandButton,
	columnVisibilityItems
} from './classification-table';
import {
	buildFacetOptions,
	makeSearchFilter,
	someOfFilter
} from './classification-table.utils';
import { useClassificationTableState } from './use-classification-table-state';
import {
	DESTRUCTIVE_FILL_CLASS,
	ISSUE_ACTIONS_COLUMN_CLASS,
	ISSUE_ACTIONS_HEADER_CLASS,
	IssueLinkButton
} from './issue-actions';
import { chipsForFlags } from './match-scope.utils';

const COLUMN_ID = {
	EXPANDER: 'expander',
	ACTIONS: 'actions',
	TEST: 'test',
	KEY: 'key',
	ISSUE: 'issue',
	ISSUE_STATE: 'issueState',
	CATEGORY: 'category',
	DISPOSITION: 'disposition',
	SCOPE: 'scope',
	ACTIVE: 'active',
	PARAMETERS: 'parameters',
	VERDICTS: 'verdicts',
	TAGS: 'tags',
	FILLER: 'filler'
} as const;

/**
 * The matcher's three criteria are off by default. They are long, repetitive
 * and already spelled out in the expanded row; as columns they are for the rare
 * case where you want to compare them across rules without opening each one.
 */
const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
	[COLUMN_ID.PARAMETERS]: false,
	[COLUMN_ID.VERDICTS]: false,
	[COLUMN_ID.TAGS]: false
};

/** Module-level so the URL-state hook's memos do not churn every render. */
const FILTER_KEYS = [
	COLUMN_ID.ISSUE_STATE,
	COLUMN_ID.CATEGORY,
	COLUMN_ID.DISPOSITION,
	COLUMN_ID.ACTIVE
] as const;

const ACTIVE_ORDER = ['true', 'false'] as const;

type ActiveKey = (typeof ACTIVE_ORDER)[number];

/**
 * A rule plus the issue it belongs to.
 *
 * `IssueRule` carries only `issue: number`, so the cross-issue view has to join
 * against the issues list to say anything more than an id. The per-issue view
 * needs none of it — the issue is already the page — so the join is skipped
 * there and the fields fall back to the id.
 */
interface IssueRuleRow extends IssueRule {
	issueTitle: string;
	issueState: IssueState | null;
	bugKey: string | null;
}

function buildRows(rules: IssueRule[], issues: Issue[]): IssueRuleRow[] {
	const byId = new Map(issues.map((issue) => [issue.id, issue]));

	return rules.map((rule) => {
		const issue = byId.get(rule.issue);

		return {
			...rule,
			issueTitle: issue?.title ?? `#${rule.issue}`,
			issueState: issue?.state ?? null,
			bugKey: formatBugKey(issue?.issue_ext?.key ?? null)
		};
	});
}

function notifyError(err: unknown) {
	const m = getErrorMessage(err);
	return `${m.title}\n${m.description}`;
}

interface RuleToggleProps {
	rule: IssueRule;
	projectId?: number;
}

function RuleToggle({ rule, projectId }: RuleToggleProps) {
	const [activate, activateState] = useActivateRuleMutation();
	const [deactivate, deactivateState] = useDeactivateRuleMutation();
	const isBusy = activateState.isLoading || deactivateState.isLoading;

	function toggleActive() {
		const action = rule.active ? deactivate : activate;
		const promise = action({ ruleId: rule.id, projectId }).unwrap();

		toast.promise(promise, {
			loading: rule.active ? 'Disabling rule...' : 'Enabling rule...',
			success: rule.active ? 'Rule disabled' : 'Rule enabled',
			error: notifyError,
			position: 'top-center'
		});
	}

	return (
		<Tooltip
			content={
				rule.active
					? 'Stops the rule matching future imports. Stamps it already laid down are kept.'
					: 'Applies the rule to future imports. It does not classify runs that already exist — use "Apply rules" on a run for that.'
			}
		>
			{/* Fixed width, because `Disable` and `Enable` are different lengths and
			    a column of buttons that resize row to row reads as ragged. */}
			<ButtonTw
				variant={rule.active ? 'destruction-secondary' : 'secondary'}
				size="xss"
				state={isBusy ? 'loading' : 'default'}
				onClick={toggleActive}
				className={cn(
					'justify-center whitespace-nowrap',
					rule.active && DESTRUCTIVE_FILL_CLASS
				)}
				data-testid="issue-rule-toggle"
			>
				<Icon
					name={rule.active ? 'CrossSimple' : 'Refresh'}
					size={14}
					className="mr-1"
				/>
				{rule.active ? 'Disable' : 'Enable'}
			</ButtonTw>
		</Tooltip>
	);
}

interface MatcherDetailProps {
	rule: IssueRule;
}

/**
 * The concrete matcher, which the flag chips only hint at. Every criterion is
 * exact — no operators, no regex — and an empty one is simply ignored.
 */
function MatcherDetail({ rule }: MatcherDetailProps) {
	const parameters = Object.entries(rule.parameters ?? {});

	// Colours taken from wherever the run page shows the same thing, so a
	// parameter looks like a parameter whether you are reading a result or the
	// rule that matched it: parameters `bg-badge-1` (result table), verdicts
	// transparent-on-border (`VerdictList`), tags `bg-badge-0` (run details).
	const sections: {
		label: string;
		hint: string;
		values: string[];
		variant?: BadgeVariants;
		className?: string;
	}[] = [
		{
			label: 'Parameters',
			hint: 'The result must carry all of these, matched exactly.',
			// `key = value` was hand-written here. Everywhere else in the app a
			// parameter is joined with the configured display delimiter — `key:
			// value` by default — via the shared formatter, and the run's result
			// table renders the very same parameters that way.
			values: parameters.map(([key, value]) =>
				formatKeyValueForDisplay(
					`${key}${config.keyValueSubmitDelimiter}${value}`,
					{
						displayDelimiter: config.keyValueDisplayDelimiter,
						submitDelimiter: config.keyValueSubmitDelimiter
					}
				)
			),
			className: 'bg-badge-1'
		},
		{
			label: 'Verdicts',
			hint: 'The result must carry all of these verdicts.',
			values: rule.verdicts ?? [],
			variant: BadgeVariants.Transparent
		},
		{
			label: 'Tags',
			hint: 'Run-level gate — a run missing any of these is skipped entirely.',
			values: rule.tags ?? [],
			className: 'bg-badge-0'
		}
	];

	return (
		<div className="flex flex-col gap-3 px-4 py-3" data-testid="rule-matcher">
			<div className="flex flex-col gap-1">
				<span className="text-[0.6875rem] font-bold tracking-wider uppercase text-text-menu">
					Test
				</span>
				<span className="text-sm font-medium text-text-primary">
					{rule.test_name}
				</span>
			</div>
			{sections.map((section) => (
				<div key={section.label} className="flex flex-col gap-1">
					<Tooltip content={section.hint}>
						<span className="w-fit text-[0.6875rem] font-bold tracking-wider uppercase text-text-menu">
							{section.label}
						</span>
					</Tooltip>
					{section.values.length ? (
						<div className="flex flex-wrap gap-1">
							{section.values.map((value) => (
								<Badge
									key={value}
									variant={section.variant}
									className={section.className}
									overflowWrap
								>
									{value}
								</Badge>
							))}
						</div>
					) : (
						<span className="text-xs text-text-menu">
							Not constrained — this criterion is ignored
						</span>
					)}
				</div>
			))}
		</div>
	);
}

/**
 * The tracker key, in its own column so it starts every row in the same place
 * — the shape the issues list and the run's issue table already use. Sharing a
 * cell with the title meant the titles started at a different offset on every
 * row, according to how long the key beside them happened to be.
 *
 * `w-px` + `whitespace-nowrap` is the shrink-to-fit idiom: the width is only a
 * floor, so the column collapses to its widest key, and the key is never
 * measured mid-break (`E2E-105` would otherwise split at the dash).
 */
const KEY_COLUMN: ColumnDef<IssueRuleRow, unknown> = {
	id: COLUMN_ID.KEY,
	accessorFn: (row) => row.bugKey ?? '',
	header: 'Key',
	meta: { className: 'w-px whitespace-nowrap', badgeCell: true },
	enableSorting: false,
	cell: ({ row }) => (
		<BugKeyChip
			bugKey={row.original.bugKey}
			issueId={row.original.issue}
			fallback={`#${row.original.issue}`}
		/>
	)
};

const ISSUE_COLUMN: ColumnDef<IssueRuleRow, unknown> = {
	id: COLUMN_ID.ISSUE,
	accessorFn: (row) => row.issueTitle,
	header: 'Issue',
	meta: { className: 'w-[22rem]' },
	cell: ({ row }) => (
		<Tooltip content={`Open ${row.original.issueTitle} and its other rules`}>
			<LinkWithProject
				to={routes.issue({ issueId: row.original.issue })}
				className="block min-w-0 font-medium truncate text-text-primary hover:text-primary hover:underline"
			>
				{row.original.issueTitle}
			</LinkWithProject>
		</Tooltip>
	)
};

/**
 * The issue's own open/closed state, in a column of its own so it sits where
 * `IssuesTable` and `RunIssuesTable` put it instead of trailing the title.
 *
 * It matters here for the same reason it does there: closing an issue
 * deactivates every rule under it, so a closed issue overrides the Rule column
 * further along the row.
 */
/**
 * Headed `Rule`, not `State`. This is the *rule's* active flag, and the issue's
 * open/closed state has a column of its own — two columns both headed `State`
 * meaning different things is worse than a slightly terse header. The id and
 * its URL filter key are unchanged, so shared links keep resolving.
 *
 * Sits directly after the test and the issue it belongs to, because it decides
 * whether anything further along the row is in force at all.
 */
const SCOPE_COLUMN: ColumnDef<IssueRuleRow, unknown> = {
	id: COLUMN_ID.SCOPE,
	header: 'Match scope',
	meta: { className: 'w-64' },
	enableSorting: false,
	cell: ({ row }) => {
		const chips = chipsForFlags({
			matchParameters: row.original.match_parameters,
			matchVerdicts: row.original.match_verdicts,
			matchImportantTags: row.original.match_important_tags,
			matchAllTags: row.original.match_all_tags
		});

		return (
			<div className="flex flex-wrap gap-1">
				{chips.map((chip) => (
					<span
						key={chip}
						className="px-1.5 py-0.5 text-[0.6875rem] rounded bg-primary-wash border border-border-primary"
					>
						{chip}
					</span>
				))}
			</div>
		);
	}
};

const DISPOSITION_COLUMN: ColumnDef<IssueRuleRow, unknown> = {
	id: COLUMN_ID.DISPOSITION,
	accessorFn: (row) => dispositionKey(row.expected),
	header: 'Disposition',
	meta: { className: 'w-px whitespace-nowrap', badgeCell: true },
	enableSorting: false,
	filterFn: someOfFilter,
	cell: ({ row }) => <DispositionBadge expected={row.original.expected} />
};

const CATEGORY_COLUMN: ColumnDef<IssueRuleRow, unknown> = {
	id: COLUMN_ID.CATEGORY,
	accessorFn: (row) => row.category,
	header: 'Category',
	meta: { className: 'w-44', badgeCell: true },
	enableSorting: false,
	filterFn: someOfFilter,
	cell: ({ row }) => <CategoryBadge category={row.original.category} />
};

/** The display form of a matcher parameter — see `MatcherDetail`. */
function formatRuleParameter(key: string, value: string) {
	return formatKeyValueForDisplay(
		`${key}${config.keyValueSubmitDelimiter}${value}`,
		{
			displayDelimiter: config.keyValueDisplayDelimiter,
			submitDelimiter: config.keyValueSubmitDelimiter
		}
	);
}

function MatcherValues({
	values,
	variant,
	className
}: {
	values: string[];
	variant?: BadgeVariants;
	className?: string;
}) {
	if (!values.length) return <span className="text-text-menu">-</span>;

	return (
		<div className="flex flex-wrap gap-1">
			{values.map((value) => (
				<Badge key={value} variant={variant} className={className} overflowWrap>
					{value}
				</Badge>
			))}
		</div>
	);
}

/**
 * The matcher's criteria as columns, so they can be compared down a list rather
 * than one expanded row at a time. Hidden by default — see
 * `DEFAULT_COLUMN_VISIBILITY` — and coloured exactly as the expanded row and
 * the run's result table colour the same things.
 */
const PARAMETERS_COLUMN: ColumnDef<IssueRuleRow, unknown> = {
	id: COLUMN_ID.PARAMETERS,
	accessorFn: (row) =>
		Object.entries(row.parameters ?? {})
			.map(([key, value]) => formatRuleParameter(key, value))
			.join(' '),
	header: 'Parameters',
	meta: { className: 'w-64', badgeCell: true },
	enableSorting: false,
	cell: ({ row }) => (
		<MatcherValues
			values={Object.entries(row.original.parameters ?? {}).map(
				([key, value]) => formatRuleParameter(key, value)
			)}
			className="bg-badge-1"
		/>
	)
};

const VERDICTS_COLUMN: ColumnDef<IssueRuleRow, unknown> = {
	id: COLUMN_ID.VERDICTS,
	accessorFn: (row) => (row.verdicts ?? []).join(' '),
	header: 'Verdicts',
	meta: { className: 'w-64', badgeCell: true },
	enableSorting: false,
	cell: ({ row }) => (
		<MatcherValues
			values={row.original.verdicts ?? []}
			variant={BadgeVariants.Transparent}
		/>
	)
};

const TAGS_COLUMN: ColumnDef<IssueRuleRow, unknown> = {
	id: COLUMN_ID.TAGS,
	accessorFn: (row) => (row.tags ?? []).join(' '),
	header: 'Tags',
	meta: { className: 'w-64', badgeCell: true },
	enableSorting: false,
	cell: ({ row }) => (
		<MatcherValues values={row.original.tags ?? []} className="bg-badge-0" />
	)
};

const ACTIVE_COLUMN: ColumnDef<IssueRuleRow, unknown> = {
	id: COLUMN_ID.ACTIVE,
	accessorFn: (row) => String(row.active),
	header: 'Rule',
	meta: { className: 'w-px whitespace-nowrap', badgeCell: true },
	enableSorting: false,
	filterFn: someOfFilter,
	cell: ({ row }) => <RuleActiveBadge active={row.original.active} />
};

const ISSUE_STATE_COLUMN: ColumnDef<IssueRuleRow, unknown> = {
	id: COLUMN_ID.ISSUE_STATE,
	accessorFn: (row) => row.issueState ?? '',
	header: 'State',
	meta: { className: 'w-px whitespace-nowrap', badgeCell: true },
	enableSorting: false,
	filterFn: someOfFilter,
	cell: ({ row }) =>
		row.original.issueState ? (
			<IssueStateBadge state={row.original.issueState} />
		) : (
			<span className="text-text-menu">-</span>
		)
};

interface GetColumnsArgs {
	projectId?: number;
	/** Only the cross-issue view needs to say which issue a rule belongs to. */
	showIssue: boolean;
}

function getColumns({
	projectId,
	showIssue
}: GetColumnsArgs): ColumnDef<IssueRuleRow, unknown>[] {
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
						row.getIsExpanded() ? 'Hide matcher' : 'Show what this rule matches'
					}
					testId="issue-rule-expander"
				/>
			)
		},
		{
			// Straight after the expander, matching the issues list: the controls
			// sit where the row starts rather than at its far edge.
			id: COLUMN_ID.ACTIONS,
			enableHiding: false,
			header: 'Actions',
			meta: {
				className: ISSUE_ACTIONS_COLUMN_CLASS,
				headerClassName: ISSUE_ACTIONS_HEADER_CLASS
			},
			enableSorting: false,
			cell: ({ row }) => (
				<div className="flex items-center gap-1.5 w-fit">
					{/* Cross-issue view only — on an issue's own page you are already
					    where this would take you. */}
					{showIssue ? (
						<>
							<IssueLinkButton
								issueId={row.original.issue}
								title={row.original.issueTitle}
							/>
							<Separator orientation="vertical" className="h-5" />
						</>
					) : null}
					<RuleToggle rule={row.original} projectId={projectId} />
				</div>
			)
		},
		{
			// Shrink-to-fit rather than capped: a test path is one unbroken token,
			// so wrapping it helps nobody, and the filler column takes the slack
			// this would otherwise absorb.
			id: COLUMN_ID.TEST,
			accessorFn: (row) => row.test_name,
			header: 'Test',
			meta: { className: 'w-px whitespace-nowrap' },
			// The toolbar's free-text box lives on this column. On the cross-issue
			// view the issue is part of the row, so it is part of the haystack.
			filterFn: makeSearchFilter<IssueRuleRow>((row) =>
				showIssue
					? [row.test_name, row.issueTitle, row.bugKey]
					: [row.test_name]
			),
			cell: ({ row }) => (
				<span className="font-medium text-text-primary">
					{row.original.test_name}
				</span>
			)
		},
		ACTIVE_COLUMN,
		SCOPE_COLUMN,
		DISPOSITION_COLUMN,
		...(showIssue ? [KEY_COLUMN, ISSUE_COLUMN, ISSUE_STATE_COLUMN] : []),
		CATEGORY_COLUMN,
		PARAMETERS_COLUMN,
		VERDICTS_COLUMN,
		TAGS_COLUMN,
		{
			// Somewhere for `table-auto` to put the spare width of a `w-full`
			// table. Without it the slack is shared across the data columns, and
			// the ones declared to shrink to their contents quietly stop doing so.
			// This column exists to be empty.
			id: COLUMN_ID.FILLER,
			enableHiding: false,
			header: () => null,
			enableSorting: false,
			cell: () => null
		}
	];
}

function useFacetOptions(rules: IssueRuleRow[]) {
	return useMemo(
		() => ({
			categoryOptions: buildFacetOptions({
				values: rules.map((rule) => rule.category),
				order: CATEGORY_ORDER,
				labelFor: (category) => categoryMeta(category).displayValue
			}),
			dispositionOptions: buildFacetOptions({
				values: rules.map((rule) => dispositionKey(rule.expected)),
				order: DISPOSITION_ORDER,
				labelFor: (disposition) => DISPOSITION_META[disposition].label
			}),
			activeOptions: buildFacetOptions({
				values: rules.map((rule) => String(rule.active) as ActiveKey),
				order: ACTIVE_ORDER,
				labelFor: (value) => ruleActiveMeta(value === 'true').label
			}),
			issueStateOptions: buildFacetOptions({
				values: rules
					.map((rule) => rule.issueState)
					.filter((state): state is IssueState => state !== null),
				order: ['open', 'closed'] as const,
				labelFor: (state) => issueStateMeta(state).label
			})
		}),
		[rules]
	);
}

export interface IssueRulesTableProps {
	/** Omit for the cross-issue view: every rule in the project. */
	issueId?: number;
	projectId?: number;
}

export function IssueRulesTable({ issueId, projectId }: IssueRulesTableProps) {
	const showIssue = issueId === undefined;

	const scrollRef = useRef<HTMLDivElement>(null);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
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
		searchColumnId: COLUMN_ID.TEST,
		// Same reasoning as the issues list: rules are read as a set.
		defaultPageSize: 100,
		defaultSorting: [{ id: COLUMN_ID.TEST, desc: false }]
	});

	const {
		data: rulesData,
		isLoading: isRulesLoading,
		error: rulesError
	} = useGetIssueRulesQuery({
		projectId,
		issue: issueId,
		page: queryArgs.page,
		pageSize: queryArgs.pageSize,
		search: queryArgs.search,
		ordering: queryArgs.ordering,
		category: queryArgs.filters[COLUMN_ID.CATEGORY],
		expected: queryArgs.filters[COLUMN_ID.DISPOSITION],
		active: queryArgs.filters[COLUMN_ID.ACTIVE]
	});

	// TODO(api): needed only to name the issue behind each rule, which
	// `/issue_rules/` could embed. Fetched a page at a time like the rules, so
	// beyond page one some rows fall back to `#id` until it does.
	const {
		data: issuesData,
		isLoading: isIssuesLoading,
		error: issuesError
	} = useGetIssuesQuery(
		showIssue
			? {
					projectId,
					page: queryArgs.page,
					pageSize: queryArgs.pageSize,
					state: queryArgs.filters[COLUMN_ID.ISSUE_STATE]
			  }
			: skipToken
	);

	const rules = useMemo(
		() => buildRows(rulesData?.results ?? [], issuesData?.results ?? []),
		[rulesData, issuesData]
	);
	// What the server says the filtered set holds, not what this page holds —
	// the difference between "25 of 45 rules" and the old "25 of 25".
	const totalCount = rulesData?.pagination.count ?? 0;
	const columns = useMemo(
		() => getColumns({ projectId, showIssue }),
		[projectId, showIssue]
	);
	const {
		categoryOptions,
		dispositionOptions,
		activeOptions,
		issueStateOptions
	} = useFacetOptions(rules);

	// Server-owned paging, filtering and sorting: this table holds one page, and
	// filtering it locally would narrow that page while claiming to have narrowed
	// the list.
	const table = useReactTable({
		data: rules,
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
		getRowCanExpand: () => true,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
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
	// Filtering happens locally, so the server's count no longer describes what
	// is on screen once a facet is on.
	const matchedCount = table.getFilteredRowModel().rows.length;
	const isNarrowed = hasFilters || Boolean(search);

	function goToPage(page: number) {
		table.setPageIndex(page - 1);
		scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
	}

	if (isRulesLoading || isIssuesLoading) {
		return (
			<div className="flex flex-col gap-1 p-2">
				{Array.from({ length: 6 }, () => 0).map((_, idx) => (
					<Skeleton key={idx} className="h-10 rounded-md" />
				))}
			</div>
		);
	}

	const error = rulesError ?? issuesError;
	if (error) return <BublikErrorState error={error} className="h-[40vh]" />;

	// Only an unfiltered empty result means "there are no rules"; with filters on,
	// the empty state belongs in the table beside the controls that caused it.
	if (!totalCount && !hasFilters && !search) {
		return (
			<BublikEmptyState
				title="No rules"
				description={
					showIssue
						? 'No rules in the active project. Rules are created by classifying a result, never on their own.'
						: 'This issue has no rules in the active project. Rules are created by classifying a result, never on their own.'
				}
				className="h-[40vh]"
			/>
		);
	}

	return (
		<div className="flex flex-col flex-1 min-h-0">
			<ClassificationToolbar>
				<span className="text-[0.75rem] font-semibold leading-[0.875rem] text-text-primary">
					Rules
				</span>
				<ClassificationToolbarSeparator />
				<ClassificationSearch
					value={search}
					onChange={setSearch}
					placeholder={showIssue ? 'Search test or issue' : 'Search test'}
					testId="issue-rules-search"
					className="min-w-[220px]"
				/>
				{showIssue ? (
					<DataTableFacetedFilter
						title="State"
						size="xss"
						options={issueStateOptions}
						value={getFilterValue(COLUMN_ID.ISSUE_STATE)}
						onChange={(values) => setFilterValue(COLUMN_ID.ISSUE_STATE, values)}
						disabled={!issueStateOptions.length}
					/>
				) : null}
				<DataTableFacetedFilter
					title="Category"
					size="xss"
					options={categoryOptions}
					value={getFilterValue(COLUMN_ID.CATEGORY)}
					onChange={(values) => setFilterValue(COLUMN_ID.CATEGORY, values)}
					disabled={!categoryOptions.length}
				/>
				<DataTableFacetedFilter
					title="Disposition"
					size="xss"
					options={dispositionOptions}
					value={getFilterValue(COLUMN_ID.DISPOSITION)}
					onChange={(values) => setFilterValue(COLUMN_ID.DISPOSITION, values)}
					disabled={!dispositionOptions.length}
				/>
				<DataTableFacetedFilter
					title="Rule"
					size="xss"
					options={activeOptions}
					value={getFilterValue(COLUMN_ID.ACTIVE)}
					onChange={(values) => setFilterValue(COLUMN_ID.ACTIVE, values)}
					disabled={!activeOptions.length}
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
						data-testid="issue-rules-reset-filters"
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
				{rows.length === 0 ? (
					<BublikEmptyState
						title="No matching rules"
						description="No rule matches the current filters."
						className="h-64"
					/>
				) : (
					<ClassificationTable
						table={table}
						stickyHeader
						testId="issue-rules-table"
						getRowAttributes={(row) => ({
							'data-testid': 'issue-rule-row',
							'data-rule-id': row.original.id,
							'data-rule-active': row.original.active ? 'true' : 'false'
						})}
						renderSubRow={(row) => <MatcherDetail rule={row.original} />}
					/>
				)}
			</div>

			<ClassificationFooter>
				<span className="text-xs text-text-menu tabular-nums">
					{isNarrowed
						? `${matchedCount} of ${totalCount} rules`
						: `${totalCount} ${totalCount === 1 ? 'rule' : 'rules'}`}
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
