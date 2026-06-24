/* SPDX-License-Identifier: Apache-2.0 */
import {
	getErrorMessage,
	useCloseIssueMutation,
	useGetIssueQuery,
	useGetIssueRulesQuery,
	useReopenIssueMutation
} from '@/services/bublik-api';
import { Badge, ButtonTw, Icon, Skeleton, toast } from '@/shared/tailwind-ui';
import { BublikEmptyState, BublikErrorState } from '@/bublik/features/ui-state';

import { IssueRuleRow } from './issue-rule-row';
import { IssueResults } from './issue-results';

const sectionHeaderClassName =
	'text-xs font-bold tracking-wider uppercase text-text-menu';

function notifyError(err: unknown) {
	const m = getErrorMessage(err);
	return `${m.title}\n${m.description}`;
}

const headerClassName =
	'px-4 py-2 font-bold text-[0.6875rem] leading-[0.875rem] tracking-wider text-left uppercase';

export interface IssueRulesTableProps {
	issueId: number;
	projectId?: number;
}

export function IssueRulesTable({ issueId, projectId }: IssueRulesTableProps) {
	const issueQuery = useGetIssueQuery({ issueId, projectId });
	const rulesQuery = useGetIssueRulesQuery({ projectId, issue: issueId });
	const [closeIssue, closeState] = useCloseIssueMutation();
	const [reopenIssue, reopenState] = useReopenIssueMutation();

	const issue = issueQuery.data;
	const isOpen = issue?.state === 'open';
	const isBusy = closeState.isLoading || reopenState.isLoading;

	function handleToggleState() {
		if (!issue) return;
		const action = isOpen ? closeIssue : reopenIssue;
		const promise = action({ issueId: issue.id, projectId }).unwrap();
		toast.promise(promise, {
			loading: isOpen ? 'Closing issue...' : 'Reopening issue...',
			success: isOpen ? 'Issue closed' : 'Issue reopened',
			error: notifyError,
			position: 'top-center'
		});
	}

	if (issueQuery.isLoading || rulesQuery.isLoading) {
		return (
			<div className="flex flex-col gap-1 mt-1">
				{Array.from({ length: 8 }, () => 0).map((_, idx) => (
					<Skeleton key={idx} className="h-10 rounded-md" />
				))}
			</div>
		);
	}

	if (issueQuery.error) {
		return <BublikErrorState error={issueQuery.error} className="h-[60vh]" />;
	}

	const rules = rulesQuery.data ?? [];

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center gap-3">
				<Icon name="TriangleExclamationMark" size={18} />
				<h1 className="text-lg font-semibold">{issue?.title ?? `Issue #${issueId}`}</h1>
				{issue?.issue_ext?.key ? (
					<span className="text-sm text-text-menu">{issue.issue_ext.key}</span>
				) : null}
				<Badge variant={isOpen ? 'unexpected' : 'expected'}>
					{isOpen ? 'Open' : 'Closed'}
				</Badge>
				{issue ? (
					<ButtonTw
						variant={isOpen ? 'destruction-secondary' : 'secondary'}
						size="xss"
						state={isBusy ? 'loading' : 'default'}
						className="ml-auto"
						onClick={handleToggleState}
					>
						{isOpen ? 'Close issue' : 'Reopen issue'}
					</ButtonTw>
				) : null}
			</div>

			<h2 className={sectionHeaderClassName}>Rules</h2>
			{rules.length === 0 ? (
				<BublikEmptyState
					title="No rules"
					description="This issue has no rules in the active project"
					className="h-[40vh]"
				/>
			) : (
				<div className="overflow-x-auto">
					<table className="min-w-full border-separate table-fixed border-spacing-y-1">
						<thead className="bg-white">
							<tr className="h-8.5">
								<th className={headerClassName}>Test</th>
								<th className={headerClassName}>Category</th>
								<th className={headerClassName}>Expected</th>
								<th className={headerClassName}>Match scope</th>
								<th className={headerClassName}>State</th>
								<th className={`${headerClassName} text-right`}>Actions</th>
							</tr>
						</thead>
						<tbody className="bg-white">
							{rules.map((rule) => (
								<IssueRuleRow key={rule.id} rule={rule} projectId={projectId} />
							))}
						</tbody>
					</table>
				</div>
			)}

			<section className="flex flex-col gap-2">
				<h2 className={sectionHeaderClassName}>Results</h2>
				<IssueResults issueId={issueId} projectId={projectId} />
			</section>
		</div>
	);
}
