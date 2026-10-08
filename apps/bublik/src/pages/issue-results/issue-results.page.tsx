/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { skipToken } from '@reduxjs/toolkit/query';

import {
	IssueDetailHeader,
	IssueHeaderBar
} from '@/bublik/features/result-classification';
import {
	IssueResultsCard,
	ResultTableHost
} from '@/bublik/features/issue-results';
import {
	LinkWithProject,
	useNavigateWithProject,
	useProjectSearch,
	useTabTitleWithPrefix
} from '@/bublik/features/projects';
import { CopyShortUrlButtonContainer } from '@/bublik/features/copy-url';
import { BublikEmptyState } from '@/bublik/features/ui-state';
import { useParams, routes } from '@/router';
import { useGetIssueQuery } from '@/services/bublik-api';
import { ButtonTw, Icon, Separator } from '@/shared/tailwind-ui';

interface IssueResultsHeaderProps {
	issueId: number;
	projectId?: number;
}

function IssueResultsHeader({ issueId, projectId }: IssueResultsHeaderProps) {
	const navigate = useNavigateWithProject();

	return (
		<header className="flex flex-col bg-bg-primary rounded shrink-0">
			<IssueHeaderBar
				issueId={issueId}
				projectId={projectId}
				onDeleted={() => navigate(routes.issues({}))}
			>
				<ButtonTw asChild variant="secondary" size="xss">
					<LinkWithProject to={routes.issue({ issueId })}>
						<Icon name="BoxArrowRight" className="mr-1.5 size-5" />
						Rules
					</LinkWithProject>
				</ButtonTw>
				<Separator orientation="vertical" className="h-5" />
				<CopyShortUrlButtonContainer />
			</IssueHeaderBar>
			<IssueDetailHeader issueId={issueId} projectId={projectId} />
		</header>
	);
}

export const IssueResultsPage = () => {
	const { issueId } = useParams<{ issueId: string }>();
	const { projectIds } = useProjectSearch();
	const projectId = projectIds[0];

	const isValidId = !!issueId && /^\d+$/.test(issueId);
	const numericIssueId = isValidId ? Number(issueId) : undefined;

	const { data: issue } = useGetIssueQuery(
		numericIssueId !== undefined
			? { issueId: numericIssueId, projectId }
			: skipToken
	);

	useTabTitleWithPrefix([issue?.title, 'Issue Results - Bublik']);

	if (numericIssueId === undefined) {
		return (
			<BublikEmptyState
				title="No data"
				description="Issue ID is missing or invalid"
			/>
		);
	}

	return (
		<div
			className="flex flex-col h-full gap-1 p-2"
			data-testid="issue-results-page"
		>
			<IssueResultsHeader issueId={numericIssueId} projectId={projectId} />
			<ResultTableHost>
				<IssueResultsCard issueId={numericIssueId} projectId={projectId} />
			</ResultTableHost>
		</div>
	);
};
