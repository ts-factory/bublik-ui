/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import {
	useCloseIssueMutation,
	useReopenIssueMutation
} from '@/services/bublik-api';
import { LinkWithProject } from '@/bublik/features/projects';
import {
	ButtonTw,
	Icon,
	Separator,
	Tooltip,
	cn,
	toast
} from '@/shared/tailwind-ui';
import { routes } from '@/router';
import type { Issue, IssueState } from '@/shared/types';

import { DESTRUCTIVE_FILL_CLASS } from './classification-colors';
import { notifyError } from './server-errors';
import { EditIssueButton, IssueDeleteButton } from './issue-modal';

/** Shared by the issues list, the run's issue table and the rules table. */
export const ISSUE_ACTIONS_COLUMN_CLASS = 'w-px whitespace-nowrap';

/**
 * The buttons in this column start well inside the cell — each carries its own
 * horizontal padding — so a header sitting at the cell's own padding reads as
 * detached from the controls beneath it.
 */
export const ISSUE_ACTIONS_HEADER_CLASS = 'pl-8';

/**
 * Re-exported from `classification-colors`, where it moved so the drawers can
 * use it without importing this file — which now renders their buttons, and
 * would otherwise close an import cycle.
 */
export { DESTRUCTIVE_FILL_CLASS };

export interface IssueStateToggleProps {
	issueId: number;
	state: IssueState;
	projectId?: number;
	className?: string;
}

export interface IssueStateActionsProps extends IssueStateToggleProps {
	/** Names the issue in the Rules tooltip and in the delete confirmation. */
	title: string;
	/**
	 * Adds Edit and Delete. Off where the row is not the place to author from —
	 * the run's issue table lists what a *run* carries, and editing the issue
	 * behind it belongs on the issue, not in a run-scoped view.
	 */
	showAuthoring?: boolean;
	/** Saves the edit drawer a fetch when the caller already holds the row. */
	issue?: Issue;
}

export interface IssueLinkButtonProps {
	issueId: number;
	/** Only used to name the destination in the tooltip. */
	title: string;
}

/**
 * The way through to an issue's own page, from any table that lists something
 * belonging to one.
 *
 * Labelled for the destination rather than its contents: `Rules` read as if it
 * opened a rules list, and `Bug` was not available — the tracker link a couple
 * of columns away already owns that word and points somewhere else entirely.
 */
export function IssueLinkButton({ issueId, title }: IssueLinkButtonProps) {
	return (
		<Tooltip content={`Open ${title} and the rules behind it`}>
			<ButtonTw
				asChild
				variant="secondary"
				size="xss"
				className="justify-center whitespace-nowrap"
			>
				<LinkWithProject
					to={routes.issue({ issueId })}
					data-testid="issue-rules-link"
				>
					<Icon name="BoxArrowRight" size={16} className="mr-1" />
					Issue
				</LinkWithProject>
			</ButtonTw>
		</Tooltip>
	);
}

/**
 * The issue lifecycle control, wherever it appears — a table row or the issue's
 * own header. One component so the two cannot drift: the wording of the
 * consequence matters, and it was previously written out twice.
 *
 * Sized to its label — no fixed width, so the column it sits in collapses to
 * exactly what the text needs.
 */
export function IssueStateToggle({
	issueId,
	state,
	projectId,
	className
}: IssueStateToggleProps) {
	const [closeIssue, closeState] = useCloseIssueMutation();
	const [reopenIssue, reopenState] = useReopenIssueMutation();

	const isOpen = state === 'open';
	const isBusy = closeState.isLoading || reopenState.isLoading;

	function handleToggle() {
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
				onClick={handleToggle}
				className={cn(
					'justify-center whitespace-nowrap',
					isOpen && DESTRUCTIVE_FILL_CLASS,
					className
				)}
				data-testid={isOpen ? 'issue-close' : 'issue-reopen'}
			>
				<Icon
					name={isOpen ? 'CrossSimple' : 'Refresh'}
					size={14}
					className="mr-1"
				/>
				{isOpen ? 'Close' : 'Open'}
			</ButtonTw>
		</Tooltip>
	);
}

/**
 * The two things you can do to an issue from a table row: open its rules, or
 * flip its lifecycle.
 *
 * The column shrinks to these buttons via `ISSUE_ACTIONS_COLUMN_CLASS`, which
 * only holds if the table gives its slack to a filler column — otherwise
 * `table-auto` shares the spare width across every column, this one included.
 */
export function IssueStateActions({
	issueId,
	title,
	state,
	projectId,
	showAuthoring = false,
	issue
}: IssueStateActionsProps) {
	return (
		// A rule with a divider between them, so the two read as one control
		// group rather than as buttons that happen to be adjacent. `w-fit` keeps
		// the group off the cell's full width; neither button carries a width of
		// its own, so the column collapses to what the labels need.
		<div className="flex items-center gap-1.5 w-fit">
			<IssueLinkButton issueId={issueId} title={title} />
			<Separator orientation="vertical" className="h-5" />
			<IssueStateToggle issueId={issueId} state={state} projectId={projectId} />
			{/* Behind their own rule, and icon-only: Close is the control you
			    reach for daily, and a cell already carrying two labelled buttons
			    should not grow a third and a fourth. Both hide for non-admins. */}
			{showAuthoring ? (
				<>
					<Separator orientation="vertical" className="h-5" />
					<EditIssueButton
						issueId={issueId}
						projectId={projectId}
						issue={issue}
						iconOnly
					/>
					<IssueDeleteButton
						issueId={issueId}
						title={title}
						projectId={projectId}
						iconOnly
					/>
				</>
			) : null}
		</div>
	);
}
