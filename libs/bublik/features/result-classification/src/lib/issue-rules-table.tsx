/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useEffect, useMemo, type ReactNode } from 'react';

import { useIsScrollbarVisible } from '@/shared/hooks';
import { skipToken } from '@reduxjs/toolkit/query';
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
	Tooltip
} from '@/shared/tailwind-ui';
import { BublikEmptyState, BublikErrorState } from '@/bublik/features/ui-state';
import { LinkWithProject } from '@/bublik/features/projects';
import { routes } from '@/router';
import { config } from '@/bublik/config';
import { formatKeyValueForDisplay } from '@/shared/utils';
import type { Issue, IssueRule, IssueState } from '@/shared/types';

import {
	CATEGORY_ORDER,
	CLASSIFICATION_BADGE_CLASS,
	DISPOSITION_ORDER,
	DISPOSITION_META,
	categoryMeta,
	dispositionKey,
	formatBugKey,
	issueStateMeta,
	issueRulesState,
	ruleActiveMeta
} from './classification-colors';
import { STATUS_STRIPE_COLUMN_META, StatusStripe } from './status-stripe';
import {
	BugKeyChip,
	CategoryBadge,
	DispositionBadge,
	IssueStateBadge,
	ProjectBadge,
	RuleActiveBadge
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
	someOfFilter,
	type FacetControls
} from './classification-table.utils';
import { useClassificationTableState } from './use-classification-table-state';
import { ISSUE_ACTIONS_COLUMN_META, IssueLinkButton } from './issue-actions';
import { chipsForRule } from './match-scope.utils';
import { EditRuleButton, RuleDeleteButton } from './rule-drawer';

const COLUMN_ID = {
	STATUS: 'status',
	/**
	 * **Not** `'project'`. A column id is also its URL key
	 * (`useClassificationTableState`), and `project` is taken: it is
	 * `PROJECT_KEY`, the multi-valued param the global project selector owns and
	 * `useProjectSearch` reads as a list of ids. Writing a project *name* there
	 * made every request send `project=NaN`.
	 */
	PROJECT: 'rule_project',
	ACTIONS: 'actions',
	TEST: 'test',
	KEY: 'key',
	ISSUE: 'issue',
	ISSUE_STATE: 'issueState',
	CATEGORY: 'category',
	DISPOSITION: 'disposition',
	SCOPE: 'scope',
	ACTIVE: 'active',
	TAGS: 'tags',
	VERDICTS: 'verdicts',
	PARAMETERS: 'parameters'
} as const;

/**
 * Every column on.
 *
 * The matcher's three criteria — tags, verdicts, parameters — used to be hidden
 * and reachable only by expanding one row at a time. But a rule *is* its
 * matcher: hiding it left the list saying which test a rule was about and
 * nothing about what it actually matches. They are columns now, ordered widest
 * gate first: tags decide whether the run is considered at all, verdicts narrow
 * to a failure mode, parameters to one iteration.
 *
 * Fitting them is the track list's problem, not this one's — see
 * `ISSUE_COLUMN` for how the width is shared out. The columns menu is there
 * for anyone who wants a narrower list than the default.
 */
const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {};

/** Module-level so the URL-state hook's memos do not churn every render. */
const FILTER_KEYS = [
	COLUMN_ID.PROJECT,
	COLUMN_ID.ISSUE_STATE,
	COLUMN_ID.CATEGORY,
	COLUMN_ID.DISPOSITION,
	COLUMN_ID.ACTIVE,
	COLUMN_ID.TAGS,
	COLUMN_ID.VERDICTS,
	COLUMN_ID.PARAMETERS
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
	/** Resolved tracker URL, when the project can resolve one. */
	bugUrl: string | null;
	/** Resolved from `project`. `Project #id` until the project list arrives. */
	projectName: string;
}

function buildRows(
	rules: IssueRule[],
	issues: Issue[],
	projectNames: Map<number, string>
): IssueRuleRow[] {
	const byId = new Map(issues.map((issue) => [issue.id, issue]));

	return rules.map((rule) => {
		const issue = byId.get(rule.issue);

		return {
			...rule,
			issueTitle: issue?.title ?? `#${rule.issue}`,
			issueState: issue?.state ?? null,
			bugKey: formatBugKey(issue?.issue_ext?.key ?? null),
			bugUrl: issue?.bug_url ?? null,
			projectName: projectNames.get(rule.project) ?? `Project #${rule.project}`
		};
	});
}

interface MatcherChipProps {
	value: string;
	columnId: string;
	variant?: BadgeVariants;
	className?: string;
	/**
	 * Given, the chip becomes the filter toggle for its own column, so clicking
	 * a tag in a row does what ticking that tag in the toolbar's facet does.
	 * Omitted, it is inert.
	 */
	facets?: FacetControls;
}

/** One matcher value: a tag, a verdict or a parameter. */
function MatcherChip({
	value,
	columnId,
	variant,
	className,
	facets
}: MatcherChipProps) {
	const isSelected = facets?.values(columnId).includes(value) ?? false;

	return (
		<Badge
			variant={variant}
			overflowWrap
			isSelected={isSelected}
			className={className}
			{...(facets
				? {
						type: 'button' as const,
						onClick: () => facets.toggle(columnId, value)
				  }
				: null)}
		>
			{value}
		</Badge>
	);
}

/**
 * The tracker key, in its own column so it starts every row in the same place
 * — the shape the issues list and the run's issue table already use. Sharing a
 * cell with the title meant the titles started at a different offset on every
 * row, according to how long the key beside them happened to be.
 *
 * `max-content` is the grid's shrink-to-fit: the track is exactly as wide as
 * the widest key in the column and no wider. Under the old `table-auto` layout
 * this took `w-px whitespace-nowrap` *and* an empty filler column downstream to
 * absorb the width it gave up; a grid track needs neither.
 */
const KEY_COLUMN: ColumnDef<IssueRuleRow, unknown> = {
	id: COLUMN_ID.KEY,
	accessorFn: (row) => row.bugKey ?? '',
	header: 'Key',
	meta: { width: 'auto', badgeCell: true },
	enableSorting: false,
	cell: ({ row }) => (
		<BugKeyChip
			bugKey={row.original.bugKey}
			bugUrl={row.original.bugUrl}
			issueId={row.original.issue}
			fallback={`#${row.original.issue}`}
		/>
	)
};

const ISSUE_COLUMN: ColumnDef<IssueRuleRow, unknown> = {
	id: COLUMN_ID.ISSUE,
	accessorFn: (row) => row.issueTitle,
	header: 'Issue',
	// How this table shares its width, in one place:
	//
	//  - The three matcher columns are `2fr`, Test and Issue are `1fr`. So of
	//    the width nobody else has claimed, the matcher takes three quarters —
	//    it is what the table is for — and the two text columns split the rest.
	//  - Everything else is `auto`: as wide as its badge needs, and no wider.
	//    `auto` is the part that makes a narrow window work, because an `auto`
	//    track will shrink back toward its min-content width under pressure,
	//    where a pinned one simply pushes the table into horizontal scroll.
	//  - Every flexible column carries a `5rem` floor, so shrinking stops
	//    somewhere legible rather than squeezing a column out of existence.
	//
	// One trap worth recording: CSS Grid hands free space to tracks that can
	// still grow *before* it feeds the `fr` tracks (§12.6 Maximize Tracks runs
	// before §12.7 Expand Flexible Tracks). A column declared `minmax(x, 20rem)`
	// therefore takes its full 20rem out of the matcher's share whether or not
	// it has anything to put there. That is why nothing here is capped with a
	// fixed ceiling — it is `auto`, or it is `fr`.
	meta: { width: 'minmax(5rem, 1fr)' },
	cell: ({ row }) => (
		<Tooltip content={`Open ${row.original.issueTitle} and its other rules`}>
			<LinkWithProject
				to={routes.issue({ issueId: row.original.issue })}
				className="block min-w-0 font-medium break-words text-text-primary hover:text-primary hover:underline"
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
	header: 'Match Scope',
	// `max-content` against a stacked list is the width of the longest single
	// chip — about five characters — rather than the width of all four in a row.
	// This column is a summary of the three matcher columns further along, so it
	// should cost the least width of anything on the row.
	meta: { width: 'auto' },
	enableSorting: false,
	cell: ({ row }) => {
		// Derived from the matcher itself, not from flags: `match_parameters` and
		// its three siblings were never on the wire — they are classify-request
		// fields that the type declared and the API has never returned — so this
		// column used to read four `undefined`s and print a bare `Path` on every
		// row. See `chipsForRule`.
		const chips = chipsForRule(row.original);

		// Neutral, and a `Badge` like every other chip in the row. These say what
		// the rule matches on; they are not filter controls, and the
		// `bg-primary-wash border-border-primary` they used to wear is exactly
		// what a *selected* Primary badge looks like -- so the one thing in the
		// table that cannot be clicked read as the one thing already chosen.
		// Stacked, not wrapped. Four chips laid out in a row set this column's
		// min-content width to the widest pair of them and wrapped raggedly at
		// anything narrower; one per line is both narrower and easier to read
		// down a list, which is the only way anyone reads this column.
		return (
			<div className="flex flex-col items-start gap-1">
				{chips.map((chip) => (
					<Badge
						key={chip}
						variant={BadgeVariants.Neutral}
						className={CLASSIFICATION_BADGE_CLASS}
					>
						{chip}
					</Badge>
				))}
			</div>
		);
	}
};

const DISPOSITION_COLUMN: ColumnDef<IssueRuleRow, unknown> = {
	id: COLUMN_ID.DISPOSITION,
	accessorFn: (row) => dispositionKey(row.expected),
	header: 'Disposition',
	meta: { width: 'auto', badgeCell: true },
	enableSorting: false,
	filterFn: someOfFilter,
	// Every badge in this table is also the control that filters by it: the
	// value handed to `toggleProps` is the one the column's `accessorFn` yields,
	// so the chip and `someOfFilter` cannot disagree.
	cell: ({ row, table }) => (
		<DispositionBadge
			expected={row.original.expected}
			{...facetControls(table).toggleProps(
				COLUMN_ID.DISPOSITION,
				dispositionKey(row.original.expected)
			)}
		/>
	)
};

const CATEGORY_COLUMN: ColumnDef<IssueRuleRow, unknown> = {
	id: COLUMN_ID.CATEGORY,
	accessorFn: (row) => row.category,
	header: 'Category',
	meta: { width: 'auto', badgeCell: true },
	enableSorting: false,
	filterFn: someOfFilter,
	cell: ({ row, table }) => (
		<CategoryBadge
			category={row.original.category}
			{...facetControls(table).toggleProps(
				COLUMN_ID.CATEGORY,
				row.original.category
			)}
		/>
	)
};

/**
 * Tags are `key=value` too, so they take the same display delimiter as
 * parameters — the run details panel formats them the same way.
 */
function ruleTags(rule: Pick<IssueRule, 'tags'>): string[] {
	return (rule.tags ?? []).map((tag) =>
		formatKeyValueForDisplay(tag, {
			displayDelimiter: config.keyValueDisplayDelimiter,
			submitDelimiter: config.keyValueSubmitDelimiter
		})
	);
}

/** Matcher parameters in display form, which is also what the facet offers. */
function ruleParameters(rule: Pick<IssueRule, 'parameters'>): string[] {
	return Object.entries(rule.parameters ?? {}).map(([key, value]) =>
		formatRuleParameter(key, value)
	);
}

/** The display form of a matcher parameter. */
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
	columnId,
	variant,
	className,
	facets
}: {
	values: string[];
	columnId: string;
	variant?: BadgeVariants;
	className?: string;
	facets?: FacetControls;
}) {
	// Nothing renders for an unconstrained criterion. It is the common case —
	// most rules pin one axis and leave the other two open — so a placeholder
	// would put a dash in most cells of three columns.
	if (!values.length) return null;

	return (
		<div className="flex flex-wrap gap-1">
			{values.map((value) => (
				<MatcherChip
					key={value}
					value={value}
					columnId={columnId}
					variant={variant}
					className={className}
					facets={facets}
				/>
			))}
		</div>
	);
}

/**
 * The matcher's criteria as columns, so they can be read down a list rather than
 * one expanded row at a time.
 *
 * Coloured the way the run page colours the same things, so a parameter looks
 * like a parameter whether you are reading a result or the rule that matched
 * it: parameters `bg-badge-1` (result table), verdicts transparent-on-border
 * (`VerdictList`), tags `bg-badge-0` (run details).
 */
const PARAMETERS_COLUMN: ColumnDef<IssueRuleRow, unknown> = {
	id: COLUMN_ID.PARAMETERS,
	accessorFn: (row) => ruleParameters(row),
	header: 'Parameters',
	meta: { width: 'minmax(5rem, 2fr)', badgeCell: true },
	enableSorting: false,
	filterFn: someOfFilter,
	cell: ({ row, table }) => (
		<MatcherValues
			values={ruleParameters(row.original)}
			columnId={COLUMN_ID.PARAMETERS}
			className="bg-badge-1"
			facets={facetControls(table)}
		/>
	)
};

const VERDICTS_COLUMN: ColumnDef<IssueRuleRow, unknown> = {
	id: COLUMN_ID.VERDICTS,
	accessorFn: (row) => row.verdicts ?? [],
	header: 'Verdicts',
	meta: { width: 'minmax(5rem, 2fr)', badgeCell: true },
	enableSorting: false,
	filterFn: someOfFilter,
	cell: ({ row, table }) => (
		<MatcherValues
			values={row.original.verdicts ?? []}
			columnId={COLUMN_ID.VERDICTS}
			variant={BadgeVariants.Transparent}
			facets={facetControls(table)}
		/>
	)
};

const TAGS_COLUMN: ColumnDef<IssueRuleRow, unknown> = {
	id: COLUMN_ID.TAGS,
	accessorFn: (row) => ruleTags(row),
	header: 'Tags',
	meta: { width: 'minmax(5rem, 2fr)', badgeCell: true },
	enableSorting: false,
	filterFn: someOfFilter,
	cell: ({ row, table }) => (
		<MatcherValues
			values={ruleTags(row.original)}
			columnId={COLUMN_ID.TAGS}
			className="bg-badge-0"
			facets={facetControls(table)}
		/>
	)
};

const ACTIVE_COLUMN: ColumnDef<IssueRuleRow, unknown> = {
	id: COLUMN_ID.ACTIVE,
	accessorFn: (row) => String(row.active),
	header: 'Rule',
	meta: { width: 'auto', badgeCell: true },
	enableSorting: false,
	filterFn: someOfFilter,
	cell: ({ row, table }) => (
		<RuleActiveBadge
			active={row.original.active}
			{...facetControls(table).toggleProps(
				COLUMN_ID.ACTIVE,
				String(row.original.active)
			)}
		/>
	)
};

const ISSUE_STATE_COLUMN: ColumnDef<IssueRuleRow, unknown> = {
	id: COLUMN_ID.ISSUE_STATE,
	accessorFn: (row) => row.issueState ?? '',
	header: 'State',
	meta: { width: 'auto', badgeCell: true },
	enableSorting: false,
	filterFn: someOfFilter,
	cell: ({ row, table }) =>
		row.original.issueState ? (
			<IssueStateBadge
				state={row.original.issueState}
				{...facetControls(table).toggleProps(
					COLUMN_ID.ISSUE_STATE,
					row.original.issueState
				)}
			/>
		) : null
};

/**
 * Which project's classifier this rule belongs to.
 *
 * The list is no longer scoped to one project, so without this a row does not
 * say where it applies — and two rules on the same test in different projects
 * were indistinguishable. It also gives the toolbar's Project facet a column to
 * filter, which is what puts its key in the URL alongside every other facet.
 */
const PROJECT_COLUMN: ColumnDef<IssueRuleRow, unknown> = {
	id: COLUMN_ID.PROJECT,
	accessorFn: (row) => row.projectName,
	header: 'Project',
	meta: { width: 'auto', badgeCell: true },
	// Sortable, unlike most columns here: a rule *is* per-project, so grouping
	// the list by hand is a thing people will want to do.
	filterFn: someOfFilter,
	// The chip is also the control that filters by it, like every other badge in
	// this table: the value handed to `toggleProps` is the one this column's
	// `accessorFn` yields, so the chip and `someOfFilter` cannot disagree.
	cell: ({ row, table }) => (
		<ProjectBadge
			name={row.original.projectName}
			{...facetControls(table).toggleProps(
				COLUMN_ID.PROJECT,
				row.original.projectName
			)}
		/>
	)
};

interface GetColumnsArgs {
	/** Only the cross-issue view needs to say which issue a rule belongs to. */
	showIssue: boolean;
}

function getColumns({
	showIssue
}: GetColumnsArgs): ColumnDef<IssueRuleRow, unknown>[] {
	return [
		{
			// Whether this rule is in force, at the row's leading edge. `active`
			// alone would not say it: closing the issue is what deactivates rules,
			// and reopening it does not switch them back on, so a rule can be off
			// for a reason that is nowhere on its own row. Reusing
			// `issueRulesState` over a set of one keeps that reading identical to
			// the issues list.
			id: COLUMN_ID.STATUS,
			enableHiding: false,
			enableSorting: false,
			header: () => null,
			meta: STATUS_STRIPE_COLUMN_META,
			cell: ({ row }) => (
				<StatusStripe
					meta={issueRulesState({
						state: row.original.issueState ?? 'open',
						total: 1,
						active: row.original.active ? 1 : 0
					})}
				/>
			)
		},
		{
			// Leading the row, matching the issues list: the controls sit where the
			// row starts rather than at its far edge.
			id: COLUMN_ID.ACTIONS,
			enableHiding: false,
			header: 'Actions',
			meta: ISSUE_ACTIONS_COLUMN_META,
			enableSorting: false,
			cell: ({ row }) => (
				// Stacked rather than strung out along the row: a vertical run of
				// labelled buttons is legible where icons behind vertical rules were
				// not. `w-fit` keeps the group off the cell's full width so the
				// column collapses to the longest label.
				//
				// Enable/Disable is deliberately absent. Flipping a rule's active
				// flag decides whether it classifies future imports at all, and a
				// one-click toggle repeated down every row made that the easiest
				// thing on the page to do by accident. It is the Rule field on the
				// edit form now.
				<div className="flex flex-col items-stretch gap-1 w-fit">
					{/* Cross-issue view only — on an issue's own page you are already
					    where this would take you. */}
					{showIssue ? (
						<>
							<IssueLinkButton
								issueId={row.original.issue}
								title={row.original.issueTitle}
							/>
							{/* Above the rule is where you go; below it is what you do to
							    the rule itself. */}
							<Separator className="my-0.5" />
						</>
					) : null}
					{/* Both hide for non-admins. */}
					<EditRuleButton rule={row.original} />
					<RuleDeleteButton rule={row.original} />
				</div>
			)
		},
		// A rule is per-project, and the list has to say which before it says
		// anything else about it — a rule that applies somewhere you are not
		// looking is a different fact from the same rule in your own project.
		PROJECT_COLUMN,
		{
			// A test path is one long unbroken token. `overflow-wrap-anywhere` is
			// what lets the track shrink under pressure — without it the column's
			// min-content width is the whole path, and a single deep test would
			// push the table into horizontal scroll for every row in it.
			id: COLUMN_ID.TEST,
			accessorFn: (row) => row.test_name,
			header: 'Test',
			// Flexible rather than `max-content`, so a single deep test path
			// cannot set the width of the column for every other row.
			// `overflow-wrap-anywhere` is what lets it shrink: without it the
			// column's min-content width is the whole unbroken path.
			meta: { width: 'minmax(5rem, 1fr)' },
			// The toolbar's free-text box lives on this column. On the cross-issue
			// view the issue is part of the row, so it is part of the haystack.
			filterFn: makeSearchFilter<IssueRuleRow>((row) =>
				showIssue
					? [row.test_name, row.issueTitle, row.bugKey]
					: [row.test_name]
			),
			cell: ({ row }) => (
				<span className="font-medium text-text-primary overflow-wrap-anywhere">
					{row.original.test_name}
				</span>
			)
		},
		ACTIVE_COLUMN,
		DISPOSITION_COLUMN,
		...(showIssue ? [KEY_COLUMN, ISSUE_COLUMN, ISSUE_STATE_COLUMN] : []),
		CATEGORY_COLUMN,
		// After the badges that classify the rule and immediately before the
		// matcher itself, because that is what it summarises: the three columns
		// that follow are the criteria, and this says which of them are in play.
		SCOPE_COLUMN,
		// The matcher itself, and the only columns here declared `1fr`: their
		// chips wrap, so they are the ones with something to do with spare width.
		// This is also what replaced the empty filler column the table used to
		// carry — under `table-auto` the slack had to be parked somewhere it could
		// do no harm, and under a grid it simply goes to the tracks that asked.
		TAGS_COLUMN,
		VERDICTS_COLUMN,
		PARAMETERS_COLUMN
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
			// Open-ended axes: the values come from the data, so the display order
			// is alphabetical rather than a fixed meaning-carrying sequence.
			parameterOptions: openFacetOptions(rules.flatMap(ruleParameters)),
			verdictOptions: openFacetOptions(
				rules.flatMap((rule) => rule.verdicts ?? [])
			),
			tagOptions: openFacetOptions(rules.flatMap(ruleTags)),
			issueStateOptions: buildFacetOptions({
				values: rules
					.map((rule) => rule.issueState)
					.filter((state): state is IssueState => state !== null),
				order: ['open', 'closed'] as const,
				labelFor: (state) => issueStateMeta(state).label
			}),
			projectOptions: openFacetOptions(rules.map((rule) => rule.projectName))
		}),
		[rules]
	);
}

export interface IssueRulesTableProps {
	/** Omit for the cross-issue view: every rule the caller is scoped to. */
	issueId?: number;
	/**
	 * Narrows the list to one project. Optional on purpose — omitted, the
	 * server returns every project's rules and the Project column says which is
	 * which. A rule is per-project, so the cross-project view is the one that
	 * answers "what will the classifier do to the next import"; scoping it to
	 * whichever project happened to be selected hid the rest with no indication
	 * they existed.
	 */
	projectId?: number;
	/** Toolbar slot, as `RunIssuesTable` has. Carries the New rule button. */
	toolbarActions?: ReactNode;
}

export function IssueRulesTable({
	issueId,
	projectId,
	toolbarActions
}: IssueRulesTableProps) {
	const showIssue = issueId === undefined;

	// The same ref serves three jobs: scroll-to-top on paging, the shadow under
	// the pinned header, and the shadow over the footer.
	const [scrollRef, isScrollable] = useIsScrollbarVisible<HTMLDivElement>();
	// Keyed by mode, not by the component. These are two different pages -- the
	// project's whole rule list and one issue's rules -- and they do not even
	// show the same columns, since Issue is meaningless once every row shares
	// one. Sharing a key meant hiding a column on one hid it on the other.
	//
	// `-v2` because the stored value outlives the default: everyone who has used
	// this page before has `{tags, verdicts, parameters} = false` in local
	// storage, and would go on seeing the old three-column-short list forever.
	const [columnVisibility, setColumnVisibility] = useColumnVisibility(
		showIssue ? 'issue-rules-all-v2' : 'issue-rules-v2',
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

	// A rule carries `project` as a bare id, and an id is not something anyone
	// recognises a project by.
	const { data: projects } = bublikAPI.useGetAllProjectsQuery();
	const projectNames = useMemo(
		() =>
			new Map((projects ?? []).map((project) => [project.id, project.name])),
		[projects]
	);

	const rules = useMemo(
		() =>
			buildRows(
				rulesData?.results ?? [],
				issuesData?.results ?? [],
				projectNames
			),
		[rulesData, issuesData, projectNames]
	);
	// What the server says the filtered set holds, not what this page holds —
	// the difference between "25 of 45 rules" and the old "25 of 25".
	const totalCount = rulesData?.pagination.count ?? 0;
	const columns = useMemo(() => getColumns({ showIssue }), [showIssue]);
	const {
		categoryOptions,
		dispositionOptions,
		activeOptions,
		issueStateOptions,
		parameterOptions,
		verdictOptions,
		tagOptions,
		projectOptions
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
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel()
	});

	const pageCount = table.getPageCount();

	// A shared link can outlive the rows it pointed at. Client-side pagination
	// does not clamp on its own, so `?page=9` on a four-page table would render
	// nothing at all, with no hint why.
	useEffect(() => clampPage(pageCount), [pageCount, clampPage]);

	// The same controls the row chips and the expanded matcher panel write
	// through, so the dropdowns and the badges are two views of one filter
	// rather than two filters.
	const facets = facetControls(table);

	const rows = table.getRowModel().rows;
	// Filtering happens locally, so the server's count no longer describes what
	// is on screen once a facet is on.
	const matchedCount = table.getFilteredRowModel().rows.length;

	// Both of these change which rows are on screen, so both return the reader
	// to the top of the list rather than to wherever the last page happened to
	// leave the scroll position.
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
						? 'No rules yet. Write one here, or classify a failing result and one is written for you.'
						: 'This issue has no rules yet. Write one here, or classify a failing result against this issue.'
				}
				className="h-[40vh]"
			>
				{toolbarActions}
			</BublikEmptyState>
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
				{/* First of the facets, because it is the widest cut: it decides
				    which project's rules are in play at all, and the others narrow
				    within that. */}
				<DataTableFacetedFilter
					title="Project"
					size="xss"
					options={projectOptions}
					value={facets.values(COLUMN_ID.PROJECT)}
					onChange={(values) => facets.set(COLUMN_ID.PROJECT, values)}
					disabled={!projectOptions.length}
				/>
				{showIssue ? (
					<DataTableFacetedFilter
						title="State"
						size="xss"
						options={issueStateOptions}
						value={facets.values(COLUMN_ID.ISSUE_STATE)}
						onChange={(values) => facets.set(COLUMN_ID.ISSUE_STATE, values)}
						disabled={!issueStateOptions.length}
					/>
				) : null}
				<DataTableFacetedFilter
					title="Category"
					size="xss"
					options={categoryOptions}
					value={facets.values(COLUMN_ID.CATEGORY)}
					onChange={(values) => facets.set(COLUMN_ID.CATEGORY, values)}
					disabled={!categoryOptions.length}
				/>
				<DataTableFacetedFilter
					title="Disposition"
					size="xss"
					options={dispositionOptions}
					value={facets.values(COLUMN_ID.DISPOSITION)}
					onChange={(values) => facets.set(COLUMN_ID.DISPOSITION, values)}
					disabled={!dispositionOptions.length}
				/>
				<DataTableFacetedFilter
					title="Rule"
					size="xss"
					options={activeOptions}
					value={facets.values(COLUMN_ID.ACTIVE)}
					onChange={(values) => facets.set(COLUMN_ID.ACTIVE, values)}
					disabled={!activeOptions.length}
				/>
				<DataTableFacetedFilter
					title="Parameters"
					size="xss"
					options={parameterOptions}
					value={facets.values(COLUMN_ID.PARAMETERS)}
					onChange={(values) => facets.set(COLUMN_ID.PARAMETERS, values)}
					disabled={!parameterOptions.length}
				/>
				<DataTableFacetedFilter
					title="Verdicts"
					size="xss"
					options={verdictOptions}
					value={facets.values(COLUMN_ID.VERDICTS)}
					onChange={(values) => facets.set(COLUMN_ID.VERDICTS, values)}
					disabled={!verdictOptions.length}
				/>
				<DataTableFacetedFilter
					title="Tags"
					size="xss"
					options={tagOptions}
					value={facets.values(COLUMN_ID.TAGS)}
					onChange={(values) => facets.set(COLUMN_ID.TAGS, values)}
					disabled={!tagOptions.length}
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
						scrollRef={scrollRef}
						testId="issue-rules-table"
						getRowAttributes={(row) => ({
							'data-testid': 'issue-rule-row',
							'data-rule-id': row.original.id,
							'data-project-id': row.original.project,
							'data-rule-active': row.original.active ? 'true' : 'false'
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
					noun="rule"
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
