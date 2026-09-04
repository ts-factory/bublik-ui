/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { ReactNode } from 'react';

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

import { DESTRUCTIVE_FILL_CLASS } from '../classification/classification.utils';
import { notifyError } from '../shared/server-errors.utils';
import { EditIssueButton, IssueDeleteButton } from '../issue-form/issue-modal.container';

/**
 * Shared by the issues list, the run's issue table and the rules table.
 *
 * `auto` is the grid's shrink-to-fit: the column is as wide as the widest
 * button in it and no wider, and it gives that width back under pressure rather
 * than pushing the table into horizontal scroll. It replaced `w-px
 * whitespace-nowrap`, which only shrank while an empty filler column existed to
 * absorb the slack it gave up.
 *
 * The header sits at `pl-8`, which is where the button labels beneath it start:
 * 8px of cell padding, 6px of the button's own `px-1.5`, then a 16px icon and
 * its 4px margin. Aligning to the buttons' left edge instead put the word
 * `Actions` a full glyph to the left of everything it labels.
 */
export const ISSUE_ACTIONS_COLUMN_META = {
	width: 'auto',
	headerClassName: 'pl-8'
} as const;

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

export interface IssueStateActionsProps {
	issueId: number;
	projectId?: number;
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
	/**
	 * Appended below the stack, behind a rule of its own — for a control that
	 * acts on the *row* rather than on the issue. The run's issue table puts its
	 * results disclosure here.
	 */
	footer?: ReactNode;
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
				className="justify-start whitespace-nowrap"
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
					'justify-start whitespace-nowrap',
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
 * What you can do to an issue from a table row: open its rules, edit it, or
 * delete it.
 *
 * Closing and reopening is deliberately *not* here. It is a consequential
 * change — closing deactivates every rule under the issue and un-suppresses
 * everything they were hiding — and a one-click button for it, repeated down
 * every row, made it the easiest thing on the page to do by accident. It lives
 * on the edit form as a State field, and on the issue's own page header where
 * there is room to say what it does.
 *
 * The column shrinks to these buttons via `ISSUE_ACTIONS_COLUMN_CLASS`, which
 * only holds if the table gives its slack to a filler column — otherwise
 * `table-auto` shares the spare width across every column, this one included.
 */
export function IssueStateActions({
	issueId,
	title,
	projectId,
	showAuthoring = false,
	issue,
	footer
}: IssueStateActionsProps) {
	return (
		// Stacked, not strung along the row: the column is narrow, and a vertical
		// run of labelled buttons is legible where four icons behind separators
		// were not. Same shape as `ActionsCell` on the import table.
		//
		// `items-stretch` so the buttons share one edge and read as a group;
		// `w-fit` keeps that group off the cell's full width, so the column
		// collapses to what the longest label needs.
		<div className="flex flex-col items-stretch gap-1 w-fit">
			<IssueLinkButton issueId={issueId} title={title} />
			{/* Horizontal now. Above the rule is where you go; below it is what
			    you do to the issue itself. */}
			<Separator className="my-0.5" />
			{/* Both hide for non-admins. */}
			{showAuthoring ? (
				<>
					<EditIssueButton
						issueId={issueId}
						projectId={projectId}
						issue={issue}
					/>
					<IssueDeleteButton
						issueId={issueId}
						title={title}
						projectId={projectId}
					/>
				</>
			) : null}
			{footer ? (
				<>
					<Separator className="my-0.5" />
					{footer}
				</>
			) : null}
		</div>
	);
}
