/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { ColumnDef } from '@tanstack/react-table';

import { LinkWithProject } from '@/bublik/features/projects';
import {
	Badge,
	Separator,
	Tooltip,
	BadgeVariants
} from '@/shared/tailwind-ui';
import { routes } from '@/router';

import {
	CATEGORY_ORDER,
	CLASSIFICATION_BADGE_CLASS,
	DISPOSITION_META,
	dispositionKey,
	issueRulesState,
	ruleActiveMeta
} from '../classification/classification.utils';
import {
	STATUS_STRIPE_COLUMN_META,
	StatusStripe
} from '../classification/status-stripe.component';
import {
	BugKeyChip,
	CategoryBadge,
	DispositionBadge,
	IssueStateBadge,
	ProjectBadge,
	RuleActiveBadge
} from '../classification/classification-badges.component';
import {
	facetControls,
	makeSearchFilter,
	someOfFilter
} from '../classification-table/classification-table.utils';
import {
	ISSUE_ACTIONS_COLUMN_META,
	IssueLinkButton
} from '../issue-detail/issue-actions.container';
import { chipsForRule } from '../rule-form/match-scope.utils';
import { EditRuleButton, RuleDeleteButton } from '../rule-form/rule-drawer.container';
import { MatcherValues } from './components';
import { COLUMN_ID } from './issue-rules-table.constants';
import type {
	GetColumnsArgs,
	IssueRuleRow
} from './issue-rules-table.types';
import { ruleParameters, ruleTags } from './issue-rules-table.utils';

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

export function getColumns({
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
