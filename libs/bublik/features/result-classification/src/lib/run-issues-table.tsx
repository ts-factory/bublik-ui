/* SPDX-License-Identifier: Apache-2.0 */
import { useState } from 'react';

import { useGetRunIssuesQuery } from '@/services/bublik-api';
import { LinkWithProject } from '@/bublik/features/projects';
import { Badge, Icon, Skeleton, cn } from '@/shared/tailwind-ui';
import { BublikEmptyState, BublikErrorState } from '@/bublik/features/ui-state';
import type { RunIssueRow } from '@/shared/types';

import { RunIssueResults } from './run-issue-results';

interface RunIssuesTableProps {
	runId: number | string;
	projectId?: number;
}

interface RunIssueRowProps {
	issue: RunIssueRow;
	runId: number | string;
	projectId?: number;
	isExpanded: boolean;
	onToggle: () => void;
}

const cellClassName =
	'px-4 py-2 text-sm border-t border-b border-transparent first:border-l last:border-r first:rounded-l last:rounded-r group-hover:border-primary group-hover:first:border-primary group-hover:last:border-primary';

function RunIssueTableRow({
	issue,
	runId,
	projectId,
	isExpanded,
	onToggle
}: RunIssueRowProps) {
	const isExpected = issue.categories.some((c) => c.expected);

	return (
		<>
			<tr className="group">
				<td className={cn(cellClassName, 'text-text-menu')}>
					{issue.bug_key ?? `#${issue.issue_id}`}
				</td>
				<td className={cn(cellClassName, 'font-medium text-text-primary')}>
					<LinkWithProject
						to={`/history?issue=${issue.issue_id}`}
						className="font-medium hover:text-primary hover:underline"
					>
						{issue.title}
					</LinkWithProject>
				</td>
				<td className={cellClassName}>
					<Badge variant={isExpected ? 'expected' : 'unexpected'}>
						{isExpected ? 'Expected' : 'Unexpected'}
					</Badge>
				</td>
				<td className={cn(cellClassName, 'text-right')}>
					<button
						type="button"
						onClick={onToggle}
						className="inline-flex items-center gap-1 ml-auto hover:text-primary"
						aria-expanded={isExpanded}
					>
						{issue.result_count}
						<Icon
							name="ArrowShortSmall"
							className={cn(
								'grid place-items-center transition-transform',
								isExpanded ? 'rotate-360' : '-rotate-90'
							)}
						/>
					</button>
				</td>
			</tr>
			{isExpanded ? (
				<tr>
					<td
						colSpan={4}
						className="border-b border-border-primary bg-primary-wash/40"
					>
						<RunIssueResults
							runId={runId}
							issueId={issue.issue_id}
							projectId={projectId}
						/>
					</td>
				</tr>
			) : null}
		</>
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

const headerClassName =
	'px-4 py-2 font-bold text-[0.6875rem] leading-[0.875rem] tracking-wider text-left uppercase';

export function RunIssuesTable({ runId, projectId }: RunIssuesTableProps) {
	const { data, isLoading, error } = useGetRunIssuesQuery({ runId, projectId });
	const [expanded, setExpanded] = useState<Set<number>>(new Set());

	const toggleExpanded = (issueId: number) => {
		setExpanded((prev) => {
			const next = new Set(prev);
			if (next.has(issueId)) next.delete(issueId);
			else next.add(issueId);
			return next;
		});
	};

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
						<th className={headerClassName}>
							<span className="inline-flex items-center gap-1">
								<Icon name="TriangleExclamationMark" size={14} />
								Issue
							</span>
						</th>
						<th className={headerClassName}>Title</th>
						<th className={cn(headerClassName, 'w-32')}>Expected</th>
						<th className={cn(headerClassName, 'w-24 text-right')}>Results</th>
					</tr>
				</thead>
				<tbody className="bg-white">
					{issues.map((issue) => (
						<RunIssueTableRow
							key={issue.issue_id}
							issue={issue}
							runId={runId}
							projectId={projectId}
							isExpanded={expanded.has(issue.issue_id)}
							onToggle={() => toggleExpanded(issue.issue_id)}
						/>
					))}
				</tbody>
			</table>
		</div>
	);
}
