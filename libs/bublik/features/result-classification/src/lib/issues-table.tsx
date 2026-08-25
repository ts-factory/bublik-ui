/* SPDX-License-Identifier: Apache-2.0 */
import {
	bublikAPI,
	getErrorMessage,
	useCloseIssueMutation,
	useGetIssuesQuery,
	useReopenIssueMutation
} from '@/services/bublik-api';
import { useProjectSearch, LinkWithProject } from '@/bublik/features/projects';
import { Badge, ButtonTw, Icon, Skeleton, toast } from '@/shared/tailwind-ui';
import { BublikEmptyState, BublikErrorState } from '@/bublik/features/ui-state';
import type { Issue } from '@/shared/types';

function notifyError(err: unknown) {
	const m = getErrorMessage(err);
	return `${m.title}\n${m.description}`;
}

interface IssueRowProps {
	issue: Issue;
	projectId?: number;
}

function IssueRow({ issue, projectId }: IssueRowProps) {
	const [closeIssue, closeState] = useCloseIssueMutation();
	const [reopenIssue, reopenState] = useReopenIssueMutation();

	const isOpen = issue.state === 'open';
	const isBusy = closeState.isLoading || reopenState.isLoading;

	function handleClose() {
		const promise = closeIssue({ issueId: issue.id, projectId }).unwrap();
		toast.promise(promise, {
			loading: 'Closing issue...',
			success: 'Issue closed',
			error: notifyError,
			position: 'top-center'
		});
	}

	function handleReopen() {
		const promise = reopenIssue({ issueId: issue.id, projectId }).unwrap();
		toast.promise(promise, {
			loading: 'Reopening issue...',
			success: 'Issue reopened',
			error: notifyError,
			position: 'top-center'
		});
	}

	return (
		<tr
			className="group"
			data-testid="issue-row"
			data-issue-id={issue.id}
			data-issue-state={issue.state}
		>
			<td className="px-4 py-2 text-sm font-medium border-t border-b border-transparent text-text-primary first:border-l last:border-r first:rounded-l last:rounded-r group-hover:border-primary group-hover:first:border-primary group-hover:last:border-primary">
				<LinkWithProject
					to={`/admin/issues/${issue.id}`}
					className="font-medium hover:text-primary hover:underline"
				>
					{issue.title}
				</LinkWithProject>
				{issue.issue_ext?.key ? (
					<span className="ml-2 text-text-menu text-xs">
						{issue.issue_ext.key}
					</span>
				) : null}
			</td>
			<td className="px-4 py-2 text-sm border-t border-b border-transparent group-hover:border-primary">
				<Badge variant={isOpen ? 'unexpected' : 'expected'}>
					{isOpen ? 'Open' : 'Closed'}
				</Badge>
			</td>
			<td className="px-4 py-2 text-sm text-right border-t border-b border-transparent last:border-r last:rounded-r group-hover:border-primary group-hover:last:border-primary">
				<div className="flex items-center justify-end gap-2">
					<ButtonTw asChild variant="secondary" size="xss">
						<LinkWithProject to={`/admin/issues/${issue.id}`}>
							<Icon name="Paper" size={14} className="mr-1.5" />
							Results
						</LinkWithProject>
					</ButtonTw>
					{isOpen ? (
						<ButtonTw
							variant="destruction-secondary"
							size="xss"
							state={isBusy ? 'loading' : 'default'}
							onClick={handleClose}
							data-testid="issue-close"
						>
							Close
						</ButtonTw>
					) : (
						<ButtonTw
							variant="secondary"
							size="xss"
							state={isBusy ? 'loading' : 'default'}
							onClick={handleReopen}
							data-testid="issue-reopen"
						>
							Reopen
						</ButtonTw>
					)}
				</div>
			</td>
		</tr>
	);
}

function IssuesTableLoading() {
	return (
		<div className="flex flex-col gap-1 mt-1">
			{Array.from({ length: 10 }, () => 0).map((_, idx) => (
				<Skeleton key={idx} className="h-10 rounded-md" />
			))}
		</div>
	);
}

interface IssuesTableContentProps {
	issues: Issue[];
	isLoading: boolean;
	error: unknown;
	projectId?: number;
	scopeLabel: string;
}

function IssuesTableContent({
	issues,
	isLoading,
	error,
	projectId,
	scopeLabel
}: IssuesTableContentProps) {
	if (isLoading) return <IssuesTableLoading />;

	if (error) {
		return <BublikErrorState error={error} className="h-[calc(100vh-256px)]" />;
	}

	if (issues.length === 0) {
		return (
			<BublikEmptyState
				title="No issues"
				description={`No issues found in ${scopeLabel}`}
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
								Issue
							</span>
						</th>
						<th className="w-32 px-4 py-2 font-bold text-[0.6875rem] leading-[0.875rem] tracking-wider text-left uppercase">
							State
						</th>
						<th className="w-52 px-4 py-2 font-bold text-[0.6875rem] leading-[0.875rem] tracking-wider text-right uppercase">
							Actions
						</th>
					</tr>
				</thead>
				<tbody className="bg-white">
					{issues.map((issue) => (
						<IssueRow key={issue.id} issue={issue} projectId={projectId} />
					))}
				</tbody>
			</table>
		</div>
	);
}

export function IssuesTable() {
	const { projectIds } = useProjectSearch();
	const projectId = projectIds[0];

	// Issues are global; `project` is an optional filter on the backend, so an
	// unscoped request legitimately lists every project. Say which it is.
	const { data: projects } = bublikAPI.useGetAllProjectsQuery();

	const { data, isLoading, error } = useGetIssuesQuery(
		projectId ? { projectId } : {}
	);

	const scopeLabel =
		projectId === undefined
			? 'all projects'
			: projects?.find((project) => project.id === projectId)?.name ??
			  `project ${projectId}`;

	return (
		<div className="flex flex-col gap-2">
			<span className="text-xs text-text-menu">
				Showing issues in {scopeLabel}
			</span>
			<IssuesTableContent
				issues={data ?? []}
				isLoading={isLoading}
				error={error}
				projectId={projectId}
				scopeLabel={scopeLabel}
			/>
		</div>
	);
}
