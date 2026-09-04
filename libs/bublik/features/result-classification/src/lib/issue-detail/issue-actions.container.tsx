/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import {
	useCloseIssueMutation,
	useReopenIssueMutation
} from '@/services/bublik-api';
import { LinkWithProject } from '@/bublik/features/projects';
import { ButtonTw, Icon, Tooltip, cn, toast } from '@/shared/tailwind-ui';
import { routes } from '@/router';
import type { IssueState } from '@/shared/types';

import { DESTRUCTIVE_FILL_CLASS } from '../classification/classification.constants';
import { notifyError } from '../shared/server-errors.utils';

export { DESTRUCTIVE_FILL_CLASS };

export interface IssueStateToggleProps {
	issueId: number;
	state: IssueState;
	projectId?: number;
	className?: string;
}

export interface IssueLinkButtonProps {
	issueId: number;
	title: string;
}

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
