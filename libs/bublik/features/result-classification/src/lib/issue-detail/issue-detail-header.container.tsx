/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { ReactNode } from 'react';

import { useGetIssueQuery, useGetIssueRulesQuery } from '@/services/bublik-api';
import {
	Badge,
	CardHeader,
	Separator,
	Skeleton,
	Tooltip
} from '@/shared/tailwind-ui';
import { BublikErrorState } from '@/bublik/features/ui-state';
import { formatTimestampToFull, parseDetailDate } from '@/shared/utils';

import {
	CLASSIFICATION_BADGE_CLASS,
	ISSUE_RULES_STATE_META,
	issueRulesState,
	issueStateMeta
} from '../classification/classification.utils';
import { BugKeyChip } from '../classification/classification-badges.component';
import { IssueStateToggle } from './issue-actions.container';
import {
	EditIssueButton,
	IssueDeleteButton
} from '../issue-form/issue-modal.container';

export interface IssueHeaderBarProps {
	issueId: number;
	projectId?: number;
	onDeleted?: () => void;
	children?: ReactNode;
}

export function IssueHeaderBar({
	issueId,
	projectId,
	onDeleted,
	children
}: IssueHeaderBarProps) {
	const { data: issue } = useGetIssueQuery({ issueId, projectId });

	const stateMeta = issue ? issueStateMeta(issue.state) : null;

	return (
		<CardHeader
			label={
				<div className="flex items-center min-w-0 gap-2">
					{issue ? (
						<h1
							className="text-[0.75rem] font-semibold leading-[0.875rem] text-text-primary truncate"
							title={issue.title}
						>
							{issue.title}
						</h1>
					) : (
						<Skeleton className="w-48 h-4 rounded" />
					)}
					{stateMeta && issue ? (
						<>
							<Separator orientation="vertical" className="h-4" />
							<Tooltip content={stateMeta.description}>
								<Badge
									variant={stateMeta.variant}
									className={CLASSIFICATION_BADGE_CLASS}
								>
									{stateMeta.label}
								</Badge>
							</Tooltip>
							<Separator orientation="vertical" className="h-4" />
							<IssueStateToggle
								issueId={issueId}
								state={issue.state}
								projectId={projectId}
							/>
						</>
					) : null}
				</div>
			}
		>
			<div className="flex items-center gap-2 shrink-0">
				{issue ? (
					<>
						<EditIssueButton
							issueId={issueId}
							projectId={projectId}
							issue={issue}
						/>
						<IssueDeleteButton
							issueId={issueId}
							title={issue.title}
							projectId={projectId}
							onDeleted={onDeleted}
						/>
					</>
				) : null}
				{children ? (
					<>
						<Separator orientation="vertical" className="h-5" />
						{children}
					</>
				) : null}
			</div>
		</CardHeader>
	);
}

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
			{issue.description ? (
				<p className="text-xs leading-[1.125rem] whitespace-pre-wrap text-text-menu">
					{issue.description}
				</p>
			) : null}

			<dl className="grid items-center grid-cols-[max-content,max-content] gap-y-2 gap-x-4">
				<Fact label="Key">
					<BugKeyChip
						bugKey={issue.issue_ext?.key ?? null}
						bugUrl={issue.bug_url ?? null}
					/>
				</Fact>
				<Fact label="Rules">
					<Tooltip content={rulesMeta.description}>
						<Badge
							variant={rulesMeta.variant}
							className={CLASSIFICATION_BADGE_CLASS}
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
