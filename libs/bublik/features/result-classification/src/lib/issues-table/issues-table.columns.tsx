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
	IssueStateBadge,
	ProjectBadge
} from '../classification/classification-badges.component';
import { DescriptionCell } from '../classification/description-cell.component';
import {
	facetControls,
	someOfFilter
} from '../classification-table/classification-table.utils';
import { ISSUE_ACTIONS_COLUMN_META } from '../issue-detail/issue-actions.constants';
import { IssueLinkButton } from '../issue-detail/issue-actions.container';
import { COLUMN_ID } from './issues-table.constants';
import type { IssueTableRow } from './issues-table.types';
import { searchFilter } from './issues-table.utils';

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
			id: COLUMN_ID.ACTIONS,
			enableHiding: false,
			header: 'Actions',
			meta: ISSUE_ACTIONS_COLUMN_META,
			enableSorting: false,
			cell: ({ row }) => (
				<IssueLinkButton issueId={row.original.id} title={row.original.title} />
			)
		},
		{
			id: COLUMN_ID.PROJECT,
			accessorFn: (row) => row.projectNames,
			header: 'Project',
			meta: { width: 'auto', badgeCell: true },
			enableSorting: false,
			filterFn: someOfFilter,
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
				/>
			)
		},
		{
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
			accessorFn: (row) => row.categories,
			header: 'Categories',
			meta: { width: 'minmax(6rem, 11rem)', badgeCell: true },
			enableSorting: false,
			filterFn: someOfFilter,
			cell: ({ row, table }) => {
				const facets = facetControls(table);

				return (
					<CategoryBadgeList
						className="flex-wrap"
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
			id: COLUMN_ID.DESCRIPTION,
			accessorFn: (row) => row.description ?? '',
			header: 'Description',
			meta: { width: 'minmax(0, 1fr)' },
			enableSorting: false,
			cell: ({ row }) => <DescriptionCell value={row.original.description} />
		}
	];
}
