/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { skipToken } from '@reduxjs/toolkit/query';

import {
	getErrorMessage,
	useGetRunDetailsQuery,
	useGetRunIssuesQuery
} from '@/services/bublik-api';
import { ButtonTw, Icon, Tooltip } from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';
import { routes } from '@/router';

export interface RunIssuesButtonProps {
	runId: string | number;
	/** Omit it and the run's own project is used, as `ApplyRulesButton` does. */
	projectId?: number;
}

function getErrorHint(error: unknown): string {
	const { title, description } = getErrorMessage(error);
	const reason = description ? `${title}: ${description}` : title;

	return `Failed to load run issues. ${reason}`;
}

// The `disabled` variant turns pointer events off, which would also swallow
// the hover the tooltip needs — same trick the New Bug button uses.
function DisabledIssuesButton({ hint }: { hint: string }) {
	return (
		<Tooltip content={hint}>
			<ButtonTw
				variant="secondary"
				size="xss"
				disabled
				className="pointer-events-auto"
				data-testid="run-issues-button"
			>
				<Icon name="IssueIcon" className="size-5 mr-1.5" />
				<span>Issues</span>
			</ButtonTw>
		</Tooltip>
	);
}

export function RunIssuesButton({ runId, projectId }: RunIssuesButtonProps) {
	const { data: details, error: detailsError } = useGetRunDetailsQuery(
		projectId === undefined ? runId : skipToken
	);
	const resolvedProjectId = projectId ?? details?.project_id;
	const { data: issues, error: issuesError } = useGetRunIssuesQuery(
		resolvedProjectId === undefined
			? skipToken
			: { runId, projectId: resolvedProjectId }
	);

	const error = detailsError ?? issuesError;

	if (error) return <DisabledIssuesButton hint={getErrorHint(error)} />;

	if (!issues) {
		return (
			<ButtonTw
				variant="secondary"
				size="xss"
				state="loading"
				data-testid="run-issues-button"
			>
				<Icon name="ProgressIndicator" className="size-5 mr-1.5 animate-spin" />
				<span>Issues</span>
			</ButtonTw>
		);
	}

	if (!issues.length) {
		return <DisabledIssuesButton hint="No issues in this run" />;
	}

	return (
		<ButtonTw
			asChild
			variant="secondary"
			size="xss"
			data-testid="run-issues-button"
		>
			<LinkWithProject to={routes.runIssues({ runId })}>
				<Icon name="IssueIcon" className="size-5 mr-1.5" />
				<span>Issues</span>
			</LinkWithProject>
		</ButtonTw>
	);
}
