/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useGetIssueQuery, useGetIssueRulesQuery } from '@/services/bublik-api';
import { Badge, Separator, Skeleton, Tooltip, cn } from '@/shared/tailwind-ui';
import { BublikErrorState } from '@/bublik/features/ui-state';
import { formatTimestampToFull, parseDetailDate } from '@/shared/utils';

import {
	CLASSIFICATION_BADGE_CLASS,
	ISSUE_RULES_STATE_META,
	issueRulesState,
	issueStateMeta
} from './classification-colors';
import { BugKeyChip } from './classification-badges';
import { IssueStateToggle } from './issue-actions';

export interface IssueDetailHeaderProps {
	issueId: number;
	projectId?: number;
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

	const stateMeta = issueStateMeta(issue.state);
	const issueRules = rules?.results ?? [];
	const activeCount = issueRules.filter((rule) => rule.active).length;
	const rulesMeta = issueRulesState({
		state: issue.state,
		total: issueRules.length,
		active: activeCount
	});

	return (
		<div
			className="flex flex-col gap-3 p-4"
			data-testid="issue-detail-header"
			data-issue-state={issue.state}
		>
			{/* Identity only. The badges used to trail the title on this line,
			    which put four differently shaped things in a row and left none of
			    them labelled — you had to already know that `2 of 9 rules active`
			    was about rules. */}
			<div className="flex flex-wrap items-center gap-2">
				<h1 className="text-sm font-semibold text-text-primary">
					{issue.title}
				</h1>
				<BugKeyChip
					bugKey={issue.issue_ext?.key ?? null}
					bugUrl={issue.bug_url ?? null}
				/>
			</div>

			{issue.description ? (
				<p className="text-xs leading-[1.125rem] whitespace-pre-wrap text-text-menu">
					{issue.description}
				</p>
			) : null}

			{/* Each badge now sits against its own label, in the same two-column
			    list as the dates — one vertical run of `label: value` rather than
			    a header row of unlabelled chips and a list underneath. */}
			<dl className="grid items-center grid-cols-[max-content,max-content] gap-y-2 gap-x-4 pt-3 border-t border-border-primary">
				<Fact label="State">
					<div className="flex items-center gap-2">
						<Tooltip content={stateMeta.description}>
							<Badge
								className={cn(CLASSIFICATION_BADGE_CLASS, stateMeta.className)}
							>
								{stateMeta.label}
							</Badge>
						</Tooltip>
						<Separator orientation="vertical" className="h-4" />
						{/* The same control the tables render, so the button that
						    closes an issue looks and reads the same wherever you meet
						    it — and here it sits directly against the state it
						    changes. */}
						<IssueStateToggle
							issueId={issueId}
							state={issue.state}
							projectId={projectId}
						/>
					</div>
				</Fact>
				<Fact label="Rules">
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
				</Fact>
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
