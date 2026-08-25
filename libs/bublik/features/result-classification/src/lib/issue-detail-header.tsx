/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import {
	getErrorMessage,
	useCloseIssueMutation,
	useGetIssueQuery,
	useGetIssueRulesQuery,
	useReopenIssueMutation
} from '@/services/bublik-api';
import {
	Badge,
	ButtonTw,
	Icon,
	Skeleton,
	Tooltip,
	cn,
	toast
} from '@/shared/tailwind-ui';
import { BublikErrorState } from '@/bublik/features/ui-state';
import { formatTimestampToFull } from '@/shared/utils';

import {
	ISSUE_RULES_STATE_META,
	formatBugKey,
	issueRulesState,
	issueStateMeta
} from './classification-colors';

export interface IssueDetailHeaderProps {
	issueId: number;
	projectId?: number;
}

function notifyError(err: unknown) {
	const m = getErrorMessage(err);
	return `${m.title}\n${m.description}`;
}

interface FactProps {
	label: string;
	children: React.ReactNode;
}

function Fact({ label, children }: FactProps) {
	return (
		<div className="flex flex-col gap-0.5">
			<span className="text-[0.6875rem] font-bold tracking-wider uppercase text-text-menu">
				{label}
			</span>
			<span className="text-sm text-text-primary">{children}</span>
		</div>
	);
}

export function IssueDetailHeader({
	issueId,
	projectId
}: IssueDetailHeaderProps) {
	const {
		data: issue,
		isLoading,
		error
	} = useGetIssueQuery({
		issueId,
		projectId
	});
	const { data: rules } = useGetIssueRulesQuery({ projectId, issue: issueId });
	const [closeIssue, closeState] = useCloseIssueMutation();
	const [reopenIssue, reopenState] = useReopenIssueMutation();

	if (isLoading) {
		return (
			<div className="flex flex-col gap-2 p-4">
				<Skeleton className="w-1/3 h-6 rounded" />
				<Skeleton className="h-12 rounded" />
			</div>
		);
	}

	if (error) return <BublikErrorState error={error} className="h-40" />;
	if (!issue) return null;

	const isOpen = issue.state === 'open';
	const isBusy = closeState.isLoading || reopenState.isLoading;
	const stateMeta = issueStateMeta(issue.state);
	const activeCount = (rules ?? []).filter((rule) => rule.active).length;
	const rulesMeta = issueRulesState({
		state: issue.state,
		total: rules?.length ?? 0,
		active: activeCount
	});

	function handleToggleState() {
		const action = isOpen ? closeIssue : reopenIssue;
		const promise = action({ issueId, projectId }).unwrap();

		toast.promise(promise, {
			loading: isOpen ? 'Closing issue...' : 'Reopening issue...',
			success: isOpen ? 'Issue closed' : 'Issue reopened',
			error: notifyError,
			position: 'top-center'
		});
	}

	return (
		<div
			className="flex flex-col gap-3 p-4"
			data-testid="issue-detail-header"
			data-issue-state={issue.state}
		>
			<div className="flex flex-wrap items-center gap-2">
				<h1 className="text-base font-semibold text-text-primary">
					{issue.title}
				</h1>
				{issue.issue_ext?.key ? (
					<Tooltip content={issue.issue_ext.key}>
						<span className="px-1.5 rounded bg-badge-0 text-[0.6875rem] leading-[1.125rem] text-text-menu">
							{formatBugKey(issue.issue_ext.key)}
						</span>
					</Tooltip>
				) : null}
				<Tooltip content={stateMeta.description}>
					<Badge className={cn('gap-1', stateMeta.className)}>
						<Icon name={stateMeta.iconName} size={14} />
						{stateMeta.label}
					</Badge>
				</Tooltip>
				<Tooltip content={rulesMeta.description}>
					<Badge
						className={cn('gap-1', rulesMeta.className)}
						data-rules-state={rulesMeta.value}
					>
						<Icon name={rulesMeta.iconName} size={14} />
						{rules?.length
							? `${activeCount} of ${rules.length} rules active`
							: ISSUE_RULES_STATE_META.unruled.label}
					</Badge>
				</Tooltip>
				<Tooltip
					content={
						isOpen
							? 'Closing also deactivates every active rule, and un-suppresses every result they were hiding — those failures start counting again.'
							: 'Reopening clears the closed state but does not re-activate the rules, so you may need to enable them by hand.'
					}
				>
					<ButtonTw
						variant={isOpen ? 'destruction-secondary' : 'secondary'}
						size="xss"
						state={isBusy ? 'loading' : 'default'}
						className="ml-auto"
						onClick={handleToggleState}
						data-testid={isOpen ? 'issue-close' : 'issue-reopen'}
					>
						{isOpen ? 'Close issue' : 'Reopen issue'}
					</ButtonTw>
				</Tooltip>
			</div>

			{issue.description ? (
				<p className="text-sm whitespace-pre-wrap text-text-secondary">
					{issue.description}
				</p>
			) : null}

			<div className="flex flex-wrap gap-8">
				<Fact label="Created">{formatTimestampToFull(issue.created_at)}</Fact>
				<Fact label="Updated">{formatTimestampToFull(issue.updated_at)}</Fact>
				{issue.closed_at ? (
					<Fact label="Closed">{formatTimestampToFull(issue.closed_at)}</Fact>
				) : null}
				{issue.issue_ext?.status ? (
					<Fact label="Tracker status">{issue.issue_ext.status}</Fact>
				) : null}
			</div>
		</div>
	);
}
