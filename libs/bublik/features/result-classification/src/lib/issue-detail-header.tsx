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
} from './classification-colors';
import { BugKeyChip } from './classification-badges';
import { IssueStateToggle } from './issue-actions';
import { EditIssueButton, IssueDeleteButton } from './issue-modal';

export interface IssueHeaderBarProps {
	issueId: number;
	projectId?: number;
	/** Where to go once the issue this page is about no longer exists. */
	onDeleted?: () => void;
	/** Page-level actions that are not about the issue — Copy Short URL. */
	children?: ReactNode;
}

/**
 * The issue page's card header: what this issue is, and everything you can do
 * to it.
 *
 * It carries the title because a page whose header says `Info` does not say
 * which issue you are looking at — the name was a heading inside the card,
 * below the bar naming the card.
 *
 * Reads `Title │ Closed │ Open`. The state badge follows the name because open
 * or closed is the first thing that qualifies it, and the toggle follows the
 * badge because it is the control that changes it — across the bar with Edit
 * and Delete, reading the state and acting on it were two separate journeys.
 * Authoring and the page-level actions keep the trailing edge.
 */
export function IssueHeaderBar({
	issueId,
	projectId,
	onDeleted,
	children
}: IssueHeaderBarProps) {
	const { data: issue } = useGetIssueQuery({ issueId, projectId });

	// The bar keeps its height and its trailing actions while the title loads,
	// so the card does not change shape underneath the cursor.
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
							{/* A rule between the name and the state, so a long title
							    running up against a badge reads as two things rather
							    than as one run-on phrase. */}
							<Separator orientation="vertical" className="h-4" />
							<Tooltip content={stateMeta.description}>
								<Badge
									variant={stateMeta.variant}
									className={CLASSIFICATION_BADGE_CLASS}
								>
									{stateMeta.label}
								</Badge>
							</Tooltip>
							{/* The control sits against the state it changes rather than
							    across the bar with the authoring buttons: reading
							    `Closed` and reaching for `Open` should not mean crossing
							    the header to find it. */}
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

/**
 * The issue's facts, under the bar that names it. Identity, state and the
 * controls live in `IssueHeaderBar`; what is left here is everything you read
 * rather than act on.
 */
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

			{/* Each badge now sits against its own label, in the same two-column
			    list as the dates — one vertical run of `label: value` rather than
			    a header row of unlabelled chips and a list underneath. */}
			<dl className="grid items-center grid-cols-[max-content,max-content] gap-y-2 gap-x-4">
				{/* State and its toggle moved to the card header — see
				    `IssueHeaderBar`. The key stayed behind and took a labelled row
				    instead of trailing the title, which is where the rest of the
				    issue's facts already are. */}
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
