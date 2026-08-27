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
	Skeleton,
	Tooltip,
	cn,
	toast
} from '@/shared/tailwind-ui';
import { BublikErrorState } from '@/bublik/features/ui-state';
import { formatTimestampToFull, parseDetailDate } from '@/shared/utils';

import {
	CLASSIFICATION_BADGE_CLASS,
	ISSUE_RULES_STATE_META,
	issueRulesState,
	issueStateMeta
} from './classification-colors';
import { BugKeyChip } from './classification-badges';

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
		<>
			<dt className="text-[0.6875rem] font-medium leading-[0.875rem] text-text-menu">
				{label}
			</dt>
			<dd className="text-[0.6875rem] font-medium leading-[0.875rem]">
				{children}
			</dd>
		</>
	);
}

/**
 * Dates read at the run-details scale: the minute-precision form in the row,
 * the full millisecond form in the tooltip -- same split the issues table uses.
 */
function TimeValue({ value }: { value: string }) {
	const formatted = parseDetailDate(value);

	return (
		<Tooltip content={formatTimestampToFull(value)}>
			<span className="tabular-nums">{formatted ?? '-'}</span>
		</Tooltip>
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
	const issueRules = rules?.results ?? [];
	const activeCount = issueRules.filter((rule) => rule.active).length;
	const rulesMeta = issueRulesState({
		state: issue.state,
		total: issueRules.length,
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
				<h1 className="text-sm font-semibold text-text-primary">
					{issue.title}
				</h1>
				<BugKeyChip bugKey={issue.issue_ext?.key ?? null} />
				<Tooltip content={stateMeta.description}>
					<Badge
						className={cn(CLASSIFICATION_BADGE_CLASS, stateMeta.className)}
					>
						{stateMeta.label}
					</Badge>
				</Tooltip>
				<Tooltip content={rulesMeta.description}>
					<Badge
						className={cn(CLASSIFICATION_BADGE_CLASS, rulesMeta.className)}
						data-rules-state={rulesMeta.value}
					>
						{issueRules.length
							? `${activeCount} of ${issueRules.length} rules active`
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
				<p className="text-xs leading-[1.125rem] whitespace-pre-wrap text-text-menu">
					{issue.description}
				</p>
			) : null}

			<dl className="grid items-center grid-cols-[max-content,max-content] gap-y-2 gap-x-4 pt-3 border-t border-border-primary">
				<Fact label="Created">
					<TimeValue value={issue.created_at} />
				</Fact>
				<Fact label="Updated">
					<TimeValue value={issue.updated_at} />
				</Fact>
				{issue.closed_at ? (
					<Fact label="Closed">
						<TimeValue value={issue.closed_at} />
					</Fact>
				) : null}
				{issue.issue_ext?.status ? (
					<Fact label="Tracker status">{issue.issue_ext.status}</Fact>
				) : null}
			</dl>
		</div>
	);
}
