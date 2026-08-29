/* SPDX-License-Identifier: Apache-2.0 */
import { useGetIssueResultsQuery } from '@/services/bublik-api';
import { routes } from '@/router';
import { LinkWithProject } from '@/bublik/features/projects';
import { Badge, Icon, Skeleton } from '@/shared/tailwind-ui';
import { BublikErrorState } from '@/bublik/features/ui-state';

import { expectedBadge } from './expected';

interface IssueResultsProps {
	issueId: number;
	projectId?: number;
}

/** Consolidated list of every result classified under an issue, across all of
 * its rules/tests. Newest run first (ordering done server-side). */
export function IssueResults({ issueId, projectId }: IssueResultsProps) {
	const { data, isLoading, error } = useGetIssueResultsQuery({
		issueId,
		projectId,
		limit: 50
	});

	if (isLoading) {
		return (
			<div className="flex flex-col gap-1 py-2">
				{Array.from({ length: 4 }, () => 0).map((_, idx) => (
					<Skeleton key={idx} className="h-8 rounded-md" />
				))}
			</div>
		);
	}

	if (error) return <BublikErrorState error={error} className="py-4" />;

	const results = data ?? [];
	if (results.length === 0) {
		return (
			<div className="px-4 py-3 text-sm text-text-menu">
				No results classified under this issue yet
			</div>
		);
	}

	return (
		<ul className="flex flex-col gap-0.5">
			{results.map((row) => (
				<li
					key={row.result_id}
					className="flex items-center gap-3 px-2 py-1 text-sm rounded hover:bg-primary-wash"
				>
					<span className="font-medium text-text-primary">
						{row.name ?? '-'}
					</span>
					{row.path.length ? (
						<span className="text-xs text-text-menu">
							{row.path.join(' / ')}
						</span>
					) : null}
					{row.category ? <Badge>{row.category}</Badge> : null}
					{row.expected !== undefined ? (
						<Badge variant={expectedBadge(row.expected).variant}>
							{expectedBadge(row.expected).label}
						</Badge>
					) : null}
					{row.obtained_result ? (
						<Badge variant="unexpected">{row.obtained_result}</Badge>
					) : null}
					{row.verdicts.length ? (
						<span className="text-text-menu">{row.verdicts.join(', ')}</span>
					) : null}
					{row.run_id ? (
						<LinkWithProject
							to={routes.log({ runId: row.run_id, focusId: row.result_id })}
							className="inline-flex items-center gap-1 ml-auto hover:text-primary hover:underline"
						>
							<Icon name="BoxArrowRight" size={14} />
							Log
						</LinkWithProject>
					) : null}
				</li>
			))}
		</ul>
	);
}
