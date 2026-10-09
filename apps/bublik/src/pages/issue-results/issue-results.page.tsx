/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { getRouteApi } from '@tanstack/react-router';

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
import { routes } from '@/router';
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

const issueResultsRoute = getRouteApi('/_app/issues/$issueId_/results');

export const IssueResultsPage = () => {
	const { issueId } = issueResultsRoute.useParams();
	const { projectIds } = useProjectSearch();
	const projectId = projectIds[0];

	const { data: issue } = useGetIssueQuery({ issueId, projectId });

	useTabTitleWithPrefix([issue?.title, 'Issue Results - Bublik']);

	return (
		<div
			className="flex flex-col h-full gap-1 p-2"
			data-testid="issue-results-page"
		>
			<IssueResultsHeader issueId={issueId} projectId={projectId} />
			<ResultTableHost>
				<IssueResultsCard issueId={issueId} projectId={projectId} />
			</ResultTableHost>
		</div>
	);
};
