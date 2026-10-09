/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { ColumnDef } from '@tanstack/react-table';

import { LinkWithProject } from '@/bublik/features/projects';
import { Tooltip } from '@/shared/tailwind-ui';
import { routes } from '@/router';
import { formatTimeToDot, formatTimestampToFull } from '@/shared/utils';

import { ISSUE_RULES_STATE_META } from '../classification/classification.constants';
import {
	STATUS_STRIPE_COLUMN_META,
	StatusStripe
} from '../classification/status-stripe.component';
import {
	BugKeyChip,
	CategoryBadgeList,
	IssueRulesBadge,
	IssueStateBadge
} from '../classification/classification-badges.component';
import {
	DescriptionCell,
	DESCRIPTION_COLUMN_META
} from '../classification/description-cell.component';
import {
	facetControls,
	someOfFilter
} from '../classification-table/classification-table.utils';
import { ISSUE_ACTIONS_COLUMN_META } from '../issue-detail/issue-actions.constants';
import {
	EditIssueButton,
	IssueDeleteButton
} from '../issue-form/issue-drawer.container';
import { COLUMN_ID } from './issues-table.constants';
import type { IssueTableRow } from './issues-table.types';
import { searchFilter } from './issues-table.utils';

/**
 * Badges first, words last. The short, glanceable columns — key, state,
 * categories, rules — sit on the left where the eye lands, and the issue's
 * title and description, the text that actually says what is wrong, take the
 * room on the right. Actions close the row, flush with the right edge past
 * the gutter that takes the surplus width.
 */
export function getColumns(): ColumnDef<IssueTableRow, unknown>[] {
	return [
		{
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
			id: COLUMN_ID.KEY,
			accessorFn: (row) => row.bugKey ?? '',
			header: 'Key',
			meta: { width: 'auto', badgeCell: true },
			enableSorting: false,
			cell: ({ row }) => (
				<BugKeyChip
					bugKey={row.original.bugKey}
					bugUrl={row.original.bugUrl}
					issueId={row.original.id}
					fallback={`#${row.original.id}`}
					closed={row.original.state === 'closed'}
				/>
			)
		},
		{
			id: COLUMN_ID.STATE,
			accessorFn: (row) => row.state,
			header: 'State',
			meta: { width: 'auto', badgeCell: true },
			enableSorting: false,
			filterFn: someOfFilter,
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
			id: COLUMN_ID.CATEGORIES,
			// The bare category strings, not the `(category, expected)` pairs the
			// row holds: `someOfFilter` compares the accessor's values against the
			// selected facet keys with `String(v)`, and an object stringifies to
			// `[object Object]` — matching nothing, every time.
			accessorFn: (row) => row.rules.map((rule) => rule.category),
			header: 'Categories',
			// Sized to the widest row's badges rather than to a guess: a fixed cap
			// either wrapped the busiest rows mid-list or left the ordinary ones —
			// one or two badges — sitting in a column of empty space.
			meta: { width: 'minmax(6rem, max-content)', badgeCell: true },
			enableSorting: false,
			filterFn: someOfFilter,
			cell: ({ row, table }) => {
				const facets = facetControls(table);

				return (
					<CategoryBadgeList
						className="flex-wrap"
						categories={row.original.rules}
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
					rulesState={row.original.rulesState}
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
			id: COLUMN_ID.RESULTS,
			accessorFn: (row) => row.result_count,
			header: 'Results',
			// The cells are flex boxes, so the count is pushed right by
			// justification, not `text-right`.
			meta: {
				width: 'auto',
				headerClassName: 'justify-end',
				cellClassName: 'justify-end'
			},
			// The server cannot order by it, and sorting one page would pass for
			// sorting the list.
			enableSorting: false,
			cell: ({ row }) => (
				<Tooltip content="Results stamped under this issue, across every run. A result two of its rules both match counts twice.">
					<span
						className="tabular-nums text-text-primary"
						data-testid="issue-result-count"
					>
						{row.original.result_count}
					</span>
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
			id: COLUMN_ID.ISSUE,
			accessorFn: (row) => row.title,
			header: 'Issue',
			// Sized to the widest title, as the rules table sizes its Issue column:
			// a fixed cap would be handed out in full before the gutter saw any of
			// the surplus, and the column would sit at its cap over short titles.
			meta: { width: 'minmax(12rem, max-content)' },
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
			id: COLUMN_ID.DESCRIPTION,
			accessorFn: (row) => row.description ?? '',
			header: 'Description',
			meta: DESCRIPTION_COLUMN_META,
			enableSorting: false,
			cell: ({ row }) => (
				<DescriptionCell
					value={row.original.description}
					title={row.original.title}
					bugKey={row.original.bugKey}
					bugUrl={row.original.bugUrl}
					issueId={row.original.id}
					closed={row.original.state === 'closed'}
					overlay
				/>
			)
		},
		{
			id: COLUMN_ID.PROJECT,
			accessorFn: (row) => row.project,
			header: 'Project',
			// Never shown: it is the column the all-projects view groups by, and
			// the grouped row's heading names the project instead. Hidden through
			// `DEFAULT_COLUMN_VISIBILITY`; `enableHiding: false` keeps it out of
			// the picker rather than pinning it on.
			enableHiding: false,
			enableSorting: false,
			enableGrouping: true
		},
		{
			id: COLUMN_ID.ACTIONS,
			enableHiding: false,
			header: 'Actions',
			meta: ISSUE_ACTIONS_COLUMN_META,
			enableSorting: false,
			cell: ({ row }) => (
				<div className="flex items-center gap-1 w-fit">
					<EditIssueButton
						issueId={row.original.id}
						projectId={row.original.project}
						issue={row.original}
						iconOnly
					/>
					<IssueDeleteButton
						issueId={row.original.id}
						title={row.original.title}
						projectId={row.original.project}
						iconOnly
					/>
				</div>
			)
		}
	];
}
