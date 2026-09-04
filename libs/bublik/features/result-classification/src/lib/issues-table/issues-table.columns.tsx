/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { ColumnDef } from '@tanstack/react-table';

import { LinkWithProject } from '@/bublik/features/projects';
import { Tooltip } from '@/shared/tailwind-ui';
import { routes } from '@/router';
import { formatTimeToDot, formatTimestampToFull } from '@/shared/utils';

import {
	ISSUE_RULES_STATE_META,
	issueRulesState,
	issueStateMeta
} from '../classification/classification.utils';
import {
	STATUS_STRIPE_COLUMN_META,
	StatusStripe
} from '../classification/status-stripe.component';
import {
	BugKeyChip,
	CategoryBadgeList,
	IssueRulesBadge,
	IssueStateBadge,
	ProjectBadge
} from '../classification/classification-badges.component';
import { DescriptionCell } from '../classification/description-cell.component';
import {
	facetControls,
	someOfFilter
} from '../classification-table/classification-table.utils';
import {
	ISSUE_ACTIONS_COLUMN_META,
	IssueStateActions
} from '../issue-detail/issue-actions.container';
import { COLUMN_ID } from './issues-table.constants';
import type { IssueTableRow } from './issues-table.types';
import { searchFilter } from './issues-table.utils';

export function getColumns(
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
			// Stacked, one chip per line, the way the rules table lays out Match
			// Scope. Laid out in a row, an issue carrying two or three categories
			// set this column's width for every row in the table — including the
			// many that carry one — and it is a column people read *down*, looking
			// for the rows in a category, rather than across. Stacked, the track is
			// as wide as the longest single label and the chips line up under each
			// other; the rows that already run to several lines pay nothing for it.
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
						// `items-start` so a chip is as wide as its own label rather
						// than stretched to the widest one in the stack.
						className="flex-col items-start"
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
