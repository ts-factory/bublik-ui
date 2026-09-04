/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { ColumnDef } from '@tanstack/react-table';

import { LinkWithProject } from '@/bublik/features/projects';
import {
	Badge,
	BadgeVariants,
	Icon,
	Separator,
	Tooltip,
	cn
} from '@/shared/tailwind-ui';
import { routes } from '@/router';

import { CLASSIFICATION_BADGE_CLASS } from '../classification/classification.constants';
import {
	dispositionKey,
	issueRulesState
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
import { ISSUE_ACTIONS_COLUMN_META } from '../issue-detail/issue-actions.constants';
import { IssueLinkButton } from '../issue-detail/issue-actions.container';
import { chipsForRule } from '../rule-form/match-scope.utils';
import {
	EditRuleButton,
	RuleDeleteButton
} from '../rule-form/rule-drawer.container';
import { MatcherValues } from './components';
import { COLUMN_ID, COLUMN_WIDTH } from './issue-rules-table.constants';
import type { GetColumnsArgs, IssueRuleRow } from './issue-rules-table.types';
import { ruleParameters, ruleTags } from './issue-rules-table.utils';

const KEY_COLUMN: ColumnDef<IssueRuleRow, unknown> = {
	id: COLUMN_ID.KEY,
	accessorFn: (row) => row.bugKey ?? '',
	header: 'Key',
	meta: { width: COLUMN_WIDTH[COLUMN_ID.KEY], badgeCell: true },
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
	meta: { width: COLUMN_WIDTH[COLUMN_ID.ISSUE] },
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

const SCOPE_COLUMN: ColumnDef<IssueRuleRow, unknown> = {
	id: COLUMN_ID.SCOPE,
	header: 'Match Scope',
	meta: { width: COLUMN_WIDTH[COLUMN_ID.SCOPE] },
	enableSorting: false,
	cell: ({ row }) => {
		const chips = chipsForRule(row.original);

		return (
			<div className="flex flex-wrap items-start gap-1">
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
	meta: { width: COLUMN_WIDTH[COLUMN_ID.DISPOSITION], badgeCell: true },
	enableSorting: false,
	filterFn: someOfFilter,
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
	meta: { width: COLUMN_WIDTH[COLUMN_ID.CATEGORY], badgeCell: true },
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

const PARAMETERS_COLUMN: ColumnDef<IssueRuleRow, unknown> = {
	id: COLUMN_ID.PARAMETERS,
	accessorFn: (row) => ruleParameters(row),
	header: 'Parameters',
	meta: { width: COLUMN_WIDTH[COLUMN_ID.PARAMETERS], badgeCell: true },
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
	meta: { width: COLUMN_WIDTH[COLUMN_ID.VERDICTS], badgeCell: true },
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
	meta: { width: COLUMN_WIDTH[COLUMN_ID.TAGS], badgeCell: true },
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
	meta: { width: COLUMN_WIDTH[COLUMN_ID.ACTIVE], badgeCell: true },
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
	meta: { width: COLUMN_WIDTH[COLUMN_ID.ISSUE_STATE], badgeCell: true },
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

const PROJECT_COLUMN: ColumnDef<IssueRuleRow, unknown> = {
	id: COLUMN_ID.PROJECT,
	accessorFn: (row) => row.projectName,
	header: 'Project',
	meta: { width: COLUMN_WIDTH[COLUMN_ID.PROJECT], badgeCell: true },
	filterFn: someOfFilter,
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

const EXPANDER_COLUMN: ColumnDef<IssueRuleRow, unknown> = {
	id: COLUMN_ID.EXPANDER,
	enableHiding: false,
	enableSorting: false,
	header: () => null,
	meta: { width: 'auto', className: 'px-1' },
	cell: ({ row }) => {
		const isExpanded = row.getIsExpanded();
		const label = isExpanded
			? 'Hide this rule\u2019s match details'
			: 'Show this rule\u2019s match scope, tags, verdicts and parameters';

		return (
			<Tooltip content={label}>
				<button
					type="button"
					aria-label={label}
					aria-expanded={isExpanded}
					onClick={row.getToggleExpandedHandler()}
					className="grid transition-colors rounded size-5 place-items-center text-text-primary hover:bg-primary-wash hover:text-primary"
					data-testid="issue-rule-expander"
				>
					<Icon
						name="ArrowShortTop"
						size={16}
						className={cn(
							'transition-transform',
							isExpanded ? 'rotate-180' : 'rotate-90'
						)}
					/>
				</button>
			</Tooltip>
		);
	}
};

export function getColumns({
	showIssue,
	compact
}: GetColumnsArgs): ColumnDef<IssueRuleRow, unknown>[] {
	return [
		{
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
		...(compact ? [EXPANDER_COLUMN] : []),
		{
			id: COLUMN_ID.ACTIONS,
			enableHiding: false,
			header: 'Actions',
			meta: ISSUE_ACTIONS_COLUMN_META,
			enableSorting: false,
			cell: ({ row }) => (
				<div className="flex items-center gap-1 w-fit">
					{showIssue ? (
						<>
							<IssueLinkButton
								issueId={row.original.issue}
								title={row.original.issueTitle}
							/>
							<Separator orientation="vertical" className="h-5 mx-0.5" />
						</>
					) : null}
					<EditRuleButton rule={row.original} iconOnly />
					<RuleDeleteButton rule={row.original} iconOnly />
				</div>
			)
		},
		PROJECT_COLUMN,
		{
			id: COLUMN_ID.TEST,
			accessorFn: (row) => row.test_name,
			header: 'Test',
			meta: { width: COLUMN_WIDTH[COLUMN_ID.TEST] },
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
		SCOPE_COLUMN,
		TAGS_COLUMN,
		VERDICTS_COLUMN,
		PARAMETERS_COLUMN
	];
}
