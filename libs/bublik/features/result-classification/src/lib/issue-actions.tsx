/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import {
	getErrorMessage,
	useCloseIssueMutation,
	useReopenIssueMutation
} from '@/services/bublik-api';
import { LinkWithProject } from '@/bublik/features/projects';
import { ButtonTw, Icon, Tooltip, cn, toast } from '@/shared/tailwind-ui';
import { routes } from '@/router';
import type { IssueState } from '@/shared/types';

/** Shared by the issues list and the run's issue table. */
export const ISSUE_ACTIONS_COLUMN_CLASS = 'w-px whitespace-nowrap';

/**
 * `destruction-secondary` carries its red as a hover state only, which leaves a
 * destructive button looking identical to a neutral one until you are already
 * pointing at it. These sit in dense table rows next to plain `secondary`
 * buttons, so the fill is on by default and hover deepens it instead.
 *
 * Applied here rather than to the variant: it is also used on the configs page
 * and in the run table, which are not part of this change.
 */
export const DESTRUCTIVE_FILL_CLASS = 'bg-red-100 hover:bg-red-200';

export interface IssueStateToggleProps {
	issueId: number;
	state: IssueState;
	projectId?: number;
	className?: string;
}

export interface IssueStateActionsProps extends IssueStateToggleProps {
	/** Only used to name the issue in the Rules tooltip. */
	title: string;
}

function notifyError(err: unknown) {
	const m = getErrorMessage(err);
	return `${m.title}\n${m.description}`;
}

/**
 * The issue lifecycle control, wherever it appears — a table row or the issue's
 * own header. One component so the two cannot drift: the wording of the
 * consequence matters, and it was previously written out twice.
 *
 * Sized to its label. In a stack it still lines up with its neighbour, because
 * the stack stretches its children to the widest of them rather than each
 * button reserving a fixed width of its own.
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
	projectId
}: IssueStateActionsProps) {
	return (
		// Stacked, not side by side: the column is the narrowest thing in the
		// table and two buttons in a row set its width for every other cell.
		//
		// `items-stretch` with no width on either button is what keeps them equal
		// *and* minimal — the pair takes the width of the longer label instead of
		// each reserving a fixed size, and `w-fit` stops the stack itself from
		// growing to fill the cell.
		<div className="flex flex-col items-stretch gap-1 w-fit">
			<Tooltip content={`Manage the rules behind ${title}`}>
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
						<Icon name="Paper" size={14} className="mr-1" />
						Rules
					</LinkWithProject>
				</ButtonTw>
			</Tooltip>
			<IssueStateToggle issueId={issueId} state={state} projectId={projectId} />
		</div>
	);
}
