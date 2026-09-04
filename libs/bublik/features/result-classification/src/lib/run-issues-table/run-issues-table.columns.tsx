/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { ColumnDef } from '@tanstack/react-table';

import { LinkWithProject } from '@/bublik/features/projects';
import { Tooltip } from '@/shared/tailwind-ui';
import { routes } from '@/router';
import type { Issue, RunIssueRow } from '@/shared/types';

import { runIssueEffect } from '../classification/classification.utils';
import {
	STATUS_STRIPE_COLUMN_META,
	StatusStripe
} from '../classification/status-stripe.component';
import {
	BugKeyChip,
	CategoryBadgeList,
	IssueStateBadge,
	RunEffectBadge
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
import { ResultsToggle } from './components';
import { COLUMN_ID } from './run-issues-table.constants';
import { searchFilter } from './run-issues-table.utils';

export function getColumns(
	projectId: number | undefined,
	/** The full issue behind each row, so Edit opens without a second fetch. */
	issueById: Map<number, Issue>
): ColumnDef<RunIssueRow, unknown>[] {
	return [
		{
			// The one question this page exists to answer — does this issue still
			// count against the run — put where you can read a screenful of rows
			// by looking down a single edge. The Effect column says the same thing
			// in words further along the row; this is the same value, same hue.
			id: COLUMN_ID.STATUS,
			enableHiding: false,
			enableSorting: false,
			header: () => null,
			meta: STATUS_STRIPE_COLUMN_META,
			cell: ({ row }) => <StatusStripe meta={runIssueEffect(row.original)} />
		},
		{
			// Leading the row, matching the issues list: an issue can be closed from
			// wherever you found it, without a detour through its own page. Closing
			// here un-suppresses results in this very run, so the table behind it
			// re-reads on success.
			id: COLUMN_ID.ACTIONS,
			enableHiding: false,
			header: 'Actions',
			meta: ISSUE_ACTIONS_COLUMN_META,
			enableSorting: false,
			cell: ({ row }) => (
				<IssueStateActions
					issueId={row.original.issue_id}
					title={row.original.title}
					projectId={projectId}
					// The same controls as `/issues`: an issue met here is the same
					// object, and having to leave the run to fix a title was the kind
					// of detour that makes people not fix it.
					issue={issueById.get(row.original.issue_id)}
					showAuthoring
					// The disclosure, which used to be a bare chevron in a column of
					// its own at the row's leading edge. A 24px icon column bought a
					// track for a control nobody could name; in the stack it is a
					// labelled button that says what it opens, and the row gets the
					// width back.
					footer={<ResultsToggle row={row} />}
				/>
			)
		},
		{
			// The external identity, on the same line as the title rather than
			// wrapped under it: when the project resolves one, the link out to the
			// tracker, then the key itself.
			//
			// `max-content` collapses the track to exactly the widest key it holds.
			// Inside the cell the link leads the key it opens, and the cell shrinks
			// to the pair rather than stretching them to its two edges.
			id: COLUMN_ID.BUG_KEY,
			accessorFn: (row) => row.bug_key ?? '',
			header: 'Key',
			meta: { width: 'auto', badgeCell: true },
			enableSorting: false,
			cell: ({ row }) => {
				const { issue_id, bug_key, bug_url } = row.original;

				return (
					<BugKeyChip
						bugKey={bug_key}
						bugUrl={bug_url}
						issueId={issue_id}
						fallback={`#${issue_id}`}
					/>
				);
			}
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
			cell: ({ row }) => {
				const { issue_id, title } = row.original;

				return (
					<Tooltip content={`Manage the rules behind ${title}`}>
						<LinkWithProject
							to={routes.issue({ issueId: issue_id })}
							className="block min-w-0 font-medium break-words text-text-primary hover:text-primary hover:underline"
						>
							{title}
						</LinkWithProject>
					</Tooltip>
				);
			}
		},
		{
			id: COLUMN_ID.RESULTS,
			accessorFn: (row) => row.result_count,
			header: 'Results',
			meta: { width: 'auto' },
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
			id: COLUMN_ID.EFFECT,
			accessorFn: (row) => runIssueEffect(row).value,
			// Named for the axis rather than for one end of it: the column reports
			// suppressed / counting again / unexpected / undecided, and heading it
			// "Counts as unexpected" read as a yes-or-no question that three of
			// those four answers do not answer. The badges carry the specifics.
			header: 'Effect On Run',
			meta: { width: 'auto', badgeCell: true },
			enableSorting: false,
			filterFn: someOfFilter,
			cell: ({ row, table }) => {
				const effect = runIssueEffect(row.original).value;

				return (
					<RunEffectBadge
						effect={effect}
						{...facetControls(table).toggleProps(COLUMN_ID.EFFECT, effect)}
					/>
				);
			}
		},
		{
			id: COLUMN_ID.CATEGORIES,
			accessorFn: (row) => row.categories.map((c) => c.category),
			header: 'Categories',
			meta: { width: 'auto', badgeCell: true },
			enableSorting: false,
			filterFn: someOfFilter,
			cell: ({ row, table }) => {
				const facets = facetControls(table);

				return (
					<CategoryBadgeList
						categories={row.original.categories.map((c) => c.category)}
						selectedCategories={facets.values(COLUMN_ID.CATEGORIES)}
						onCategoryClick={(category) =>
							facets.toggle(COLUMN_ID.CATEGORIES, category)
						}
					/>
				);
			}
		},
		{
			// Last and capped, matching `/issues`: it is empty on most issues, so
			// as the column that absorbed the spare width it was a wide band of
			// nothing sitting between the issue and the badges describing it.
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
