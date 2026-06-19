/* SPDX-License-Identifier: Apache-2.0 */
import { useGetRunIssuesQuery } from '@/services/bublik-api';
import { LinkWithProject } from '@/bublik/features/projects';
import { Badge, Icon, Skeleton } from '@/shared/tailwind-ui';
import { BublikEmptyState, BublikErrorState } from '@/bublik/features/ui-state';
import type { RunIssueRow } from '@/shared/types';

interface RunIssuesTableProps {
	runId: number | string;
	projectId?: number;
}

interface RunIssueRowProps {
	issue: RunIssueRow;
}

function RunIssueTableRow({ issue }: RunIssueRowProps) {
	const categories = issue.categories.map((c) => c.category).join(', ');
	const isExpected = issue.categories.some((c) => c.expected);

	return (
		<tr className="group">
			<td className="px-4 py-2 text-sm font-medium border-t border-b border-transparent text-text-primary first:border-l last:border-r first:rounded-l last:rounded-r group-hover:border-primary group-hover:first:border-primary group-hover:last:border-primary">
				<LinkWithProject
					to={`/history?issue=${issue.issue_id}`}
					className="font-medium hover:text-primary hover:underline"
				>
					{issue.title}
				</LinkWithProject>
			</td>
			<td className="px-4 py-2 text-sm border-t border-b border-transparent group-hover:border-primary">
				{categories || '-'}
			</td>
			<td className="px-4 py-2 text-sm border-t border-b border-transparent group-hover:border-primary">
				<Badge variant={isExpected ? 'expected' : 'unexpected'}>
					{isExpected ? 'Expected' : 'Unexpected'}
				</Badge>
			</td>
			<td className="px-4 py-2 text-sm text-right border-t border-b border-transparent group-hover:border-primary">
				{issue.result_count}
			</td>
			<td className="px-4 py-2 text-sm border-t border-b border-transparent group-hover:border-primary">
				<Badge variant={issue.state === 'open' ? 'unexpected' : 'expected'}>
					{issue.state === 'open' ? 'Open' : 'Closed'}
				</Badge>
			</td>
			<td className="px-4 py-2 text-sm border-t border-b border-transparent last:border-r last:rounded-r group-hover:border-primary group-hover:last:border-primary">
				{issue.bug_key ? (
					<span className="text-text-menu">{issue.bug_key}</span>
				) : (
					'-'
				)}
			</td>
		</tr>
	);
}

function RunIssuesTableLoading() {
	return (
		<div className="flex flex-col gap-1 mt-1">
			{Array.from({ length: 10 }, () => 0).map((_, idx) => (
				<Skeleton key={idx} className="h-10 rounded-md" />
			))}
		</div>
	);
}

export function RunIssuesTable({ runId, projectId }: RunIssuesTableProps) {
	const { data, isLoading, error } = useGetRunIssuesQuery({ runId, projectId });

	if (isLoading) return <RunIssuesTableLoading />;

	if (error) {
		return <BublikErrorState error={error} className="h-[calc(100vh-256px)]" />;
	}

	const issues = data ?? [];

	if (issues.length === 0) {
		return (
			<BublikEmptyState
				title="No issues"
				description="No issues classified in this run"
				className="h-[calc(100vh-256px)]"
			/>
		);
	}

	return (
		<div className="overflow-x-auto">
			<table className="min-w-full border-separate table-fixed border-spacing-y-1">
				<thead className="bg-white">
					<tr className="h-8.5">
						<th className="px-4 py-2 font-bold text-[0.6875rem] leading-[0.875rem] tracking-wider text-left uppercase">
							<span className="inline-flex items-center gap-1">
								<Icon name="TriangleExclamationMark" size={14} />
								Title
							</span>
						</th>
						<th className="px-4 py-2 font-bold text-[0.6875rem] leading-[0.875rem] tracking-wider text-left uppercase">
							Category
						</th>
						<th className="w-32 px-4 py-2 font-bold text-[0.6875rem] leading-[0.875rem] tracking-wider text-left uppercase">
							Expected
						</th>
						<th className="w-24 px-4 py-2 font-bold text-[0.6875rem] leading-[0.875rem] tracking-wider text-right uppercase">
							Results
						</th>
						<th className="w-24 px-4 py-2 font-bold text-[0.6875rem] leading-[0.875rem] tracking-wider text-left uppercase">
							State
						</th>
						<th className="px-4 py-2 font-bold text-[0.6875rem] leading-[0.875rem] tracking-wider text-left uppercase">
							Bug
						</th>
					</tr>
				</thead>
				<tbody className="bg-white">
					{issues.map((issue) => (
						<RunIssueTableRow key={issue.issue_id} issue={issue} />
					))}
				</tbody>
			</table>
		</div>
	);
}
