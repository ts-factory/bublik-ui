/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useGetIssueQuery } from '@/services/bublik-api';
import { ButtonTw, Icon, Tooltip } from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';

export interface IssueResultsButtonProps {
	issueId: number;
	projectId?: number;
}

/**
 * Opens the results stamped under an issue, across every run — the issue's
 * counterpart of the run page's Issues button.
 */
export function IssueResultsButton({
	issueId,
	projectId
}: IssueResultsButtonProps) {
	const { data: issue } = useGetIssueQuery({ issueId, projectId });

	if (!issue) {
		return (
			<ButtonTw
				variant="secondary"
				size="xss"
				state="loading"
				data-testid="issue-results-button"
			>
				<Icon name="ProgressIndicator" className="size-5 mr-1.5 animate-spin" />
				<span>Results</span>
			</ButtonTw>
		);
	}

	if (!issue.result_count) {
		// The `disabled` variant turns pointer events off, which would also
		// swallow the hover the tooltip needs.
		return (
			<Tooltip content="No results are classified under this issue yet">
				<ButtonTw
					variant="secondary"
					size="xss"
					disabled
					className="pointer-events-auto"
					data-testid="issue-results-button"
				>
					<Icon name="Paper" className="size-5 mr-1.5" />
					<span>Results</span>
				</ButtonTw>
			</Tooltip>
		);
	}

	return (
		<ButtonTw
			asChild
			variant="secondary"
			size="xss"
			data-testid="issue-results-button"
		>
			<LinkWithProject to="/issues/$issueId/results" params={{ issueId }}>
				<Icon name="Paper" className="size-5 mr-1.5" />
				<span>Results</span>
			</LinkWithProject>
		</ButtonTw>
	);
}
