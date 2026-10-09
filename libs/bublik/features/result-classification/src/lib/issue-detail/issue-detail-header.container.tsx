/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { ReactNode } from 'react';

import { useGetIssueQuery } from '@/services/bublik-api';
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
	CLASSIFICATION_META_BADGE_CLASS,
	ISSUE_RULES_STATE_META
} from '../classification/classification.constants';
import {
	BugKeyChip,
	IssueStateBadge
} from '../classification/classification-badges.component';
import { DescriptionBlock } from '../classification/description-cell.component';
import { IssueStateToggle } from './issue-actions.container';
import {
	EditIssueButton,
	IssueDeleteButton
} from '../issue-form/issue-drawer.container';

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
						<Separator orientation="vertical" className="h-5" />
						{/* With the other actions on the issue, not beside its state. */}
						<IssueStateToggle
							issueId={issueId}
							state={issue.state}
							projectId={projectId}
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

	// From the issue itself: counting a page of `/issue_rules/` stopped at the
	// page size.
	const rulesMeta = ISSUE_RULES_STATE_META[issue.rules_state];

	return (
		<div
			className="flex items-start gap-4 p-4"
			data-testid="issue-detail-header"
			data-issue-state={issue.state}
		>
			<dl className="grid items-center grid-cols-[max-content,max-content] gap-y-2 gap-x-4 shrink-0">
				<Fact label="Key">
					<BugKeyChip
						bugKey={issue.bug_key}
						bugUrl={issue.bug_url}
						closed={issue.state === 'closed'}
					/>
				</Fact>
				<Fact label="State">
					<IssueStateBadge state={issue.state} />
				</Fact>
				<Fact label="Rules">
					<Tooltip content={rulesMeta.description}>
						<Badge
							variant={rulesMeta.variant}
							className={CLASSIFICATION_META_BADGE_CLASS}
							data-rules-state={rulesMeta.value}
						>
							{issue.rule_count
								? `${issue.active_rule_count} of ${issue.rule_count} rules active`
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
			</dl>
			{issue.description?.trim() ? (
				<>
					<Separator orientation="vertical" className="h-auto self-stretch" />
					{/* Beside the facts: as much of it as their height holds, the rest
					    a click away. Stretched to the row the facts set, and laid in
					    out of flow, so the text never makes the header taller. */}
					<div
						className="relative self-stretch flex-1 min-w-0 max-w-[40rem]"
						data-testid="issue-detail-description"
					>
						<div className="absolute inset-0">
							<DescriptionBlock
								value={issue.description}
								title={issue.title}
								bugKey={issue.bug_key}
								bugUrl={issue.bug_url}
								issueId={issue.id}
								overlay
							/>
						</div>
					</div>
				</>
			) : null}
		</div>
	);
}
