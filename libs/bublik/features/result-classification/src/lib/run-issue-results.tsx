/* SPDX-License-Identifier: Apache-2.0 */
import { useGetRunIssueResultsQuery } from '@/services/bublik-api';
import { routes } from '@/router';
import { LinkWithProject } from '@/bublik/features/projects';
import { Badge, Icon, Skeleton } from '@/shared/tailwind-ui';
import { BublikErrorState } from '@/bublik/features/ui-state';
import type { RunIssueResultRow } from '@/shared/types';

interface RunIssueResultsProps {
	runId: number | string;
	issueId: number;
	projectId?: number;
}

function groupByPath(
	rows: RunIssueResultRow[]
): { path: string; rows: RunIssueResultRow[] }[] {
	const groups = new Map<string, RunIssueResultRow[]>();

	for (const row of rows) {
		const key = row.path.join(' / ');
		const existing = groups.get(key);
		if (existing) existing.push(row);
		else groups.set(key, [row]);
	}

	return Array.from(groups.entries()).map(([path, groupRows]) => ({
		path,
		rows: groupRows
	}));
}

export function RunIssueResults({
	runId,
	issueId,
	projectId
}: RunIssueResultsProps) {
	const { data, isLoading, error } = useGetRunIssueResultsQuery({
		runId,
		issueId,
		projectId
	});

	if (isLoading) {
		return (
			<div className="flex flex-col gap-1 py-2">
				{Array.from({ length: 3 }, () => 0).map((_, idx) => (
					<Skeleton key={idx} className="h-8 rounded-md" />
				))}
			</div>
		);
	}

	if (error) {
		return <BublikErrorState error={error} className="py-4" />;
	}

	const results = data ?? [];

	if (results.length === 0) {
		return <div className="px-4 py-3 text-sm text-text-menu">No results</div>;
	}

	const groups = groupByPath(results);

	return (
		<div className="flex flex-col gap-3 px-4 py-3">
			{groups.map((group) => (
				<div key={group.path} className="flex flex-col gap-1">
					<div className="flex items-center gap-1 text-[0.6875rem] font-bold tracking-wider uppercase text-text-menu">
						<Icon name="Folder" size={14} />
						{group.path || '(root)'}
					</div>
					<ul className="flex flex-col gap-0.5">
						{group.rows.map((row) => (
							<li
								key={row.result_id}
								className="flex items-center gap-3 px-2 py-1 text-sm rounded hover:bg-primary-wash"
							>
								<span className="font-medium text-text-primary">
									{row.name ?? '-'}
								</span>
								{row.obtained_result ? (
									<Badge variant="unexpected">{row.obtained_result}</Badge>
								) : null}
								{row.verdicts.length ? (
									<span className="text-text-menu">
										{row.verdicts.join(', ')}
									</span>
								) : null}
								<LinkWithProject
									to={routes.log({ runId, focusId: row.result_id })}
									className="inline-flex items-center gap-1 ml-auto hover:text-primary hover:underline"
								>
									<Icon name="BoxArrowRight" size={14} />
									Log
								</LinkWithProject>
							</li>
						))}
					</ul>
				</div>
			))}
		</div>
	);
}
