/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { ColumnDef } from '@tanstack/react-table';

import { LinkWithProject } from '@/bublik/features/projects';
import { Badge, BadgeVariants, Tooltip } from '@/shared/tailwind-ui';
import { routes } from '@/router';
import type { RunIssueRow } from '@/shared/types';

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
import { ISSUE_ACTIONS_COLUMN_META } from '../issue-detail/issue-actions.constants';
import { IssueLinkButton } from '../issue-detail/issue-actions.container';
import { COLUMN_ID } from './run-issues-table.constants';
import { searchFilter } from './run-issues-table.utils';

export function getColumns(): ColumnDef<RunIssueRow, unknown>[] {
	return [
		{
			id: COLUMN_ID.STATUS,
			enableHiding: false,
			enableSorting: false,
			header: () => null,
			meta: STATUS_STRIPE_COLUMN_META,
			cell: ({ row }) => <StatusStripe meta={runIssueEffect(row.original)} />
		},
		{
			id: COLUMN_ID.ACTIONS,
			enableHiding: false,
			header: 'Actions',
			meta: ISSUE_ACTIONS_COLUMN_META,
			enableSorting: false,
			cell: ({ row }) => (
				<IssueLinkButton
					issueId={row.original.issue_id}
					title={row.original.title}
				/>
			)
		},
		{
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
			meta: { width: 'auto', badgeCell: true },
			cell: ({ row }) => {
				const isExpanded = row.getIsExpanded();

				return (
					<Tooltip
						content={
							isExpanded
								? 'Hide the results this issue is stamped on'
								: 'Show the results this issue is stamped on in this run'
						}
					>
						<Badge
							as="button"
							type="button"
							variant={BadgeVariants.PrimaryActive}
							isSelected={isExpanded}
							isInteractive
							onClick={row.getToggleExpandedHandler()}
							aria-expanded={isExpanded}
							className="tabular-nums"
							data-testid="run-issue-result-count"
						>
							{row.original.result_count}
						</Badge>
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
			id: COLUMN_ID.DESCRIPTION,
			accessorFn: (row) => row.description ?? '',
			header: 'Description',
			meta: { width: 'minmax(10rem, 1fr)' },
			enableSorting: false,
			cell: ({ row }) => <DescriptionCell value={row.original.description} />
		}
	];
}
