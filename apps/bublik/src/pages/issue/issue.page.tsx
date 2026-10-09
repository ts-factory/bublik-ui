/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { getRouteApi } from '@tanstack/react-router';

import {
	IssueDetailHeader,
	IssueHeaderBar,
	IssueResultsButton,
	IssueRulesTable,
	NewRuleButton
} from '@/bublik/features/result-classification';
import {
	useProjectSearch,
	useTabTitleWithPrefix,
	useNavigateWithProject
} from '@/bublik/features/projects';
import { CopyShortUrlButtonContainer } from '@/bublik/features/copy-url';
import { routes } from '@/router';
import { useGetIssueQuery } from '@/services/bublik-api';

const issueRoute = getRouteApi('/_app/issues/$issueId');

export const IssuePage = () => {
	const { issueId } = issueRoute.useParams();
	const { projectIds } = useProjectSearch();
	const navigate = useNavigateWithProject();
	const projectId = projectIds[0];

	const { data: issue } = useGetIssueQuery({ issueId, projectId });

	useTabTitleWithPrefix([issue?.title, 'Issue - Bublik']);

	return (
		<div className="flex flex-col h-full gap-1 p-2" data-testid="issue-page">
			<header className="flex flex-col bg-bg-primary rounded shrink-0">
				<IssueHeaderBar
					issueId={issueId}
					projectId={projectId}
					onDeleted={() => navigate(routes.issues({}))}
				>
					<IssueResultsButton issueId={issueId} projectId={projectId} />
					<CopyShortUrlButtonContainer />
				</IssueHeaderBar>
				<IssueDetailHeader issueId={issueId} projectId={projectId} />
			</header>
			<div className="flex flex-col flex-1 min-h-0 bg-bg-primary rounded">
				<IssueRulesTable
					issueId={issueId}
					projectId={projectId}
					toolbarActions={
						<NewRuleButton projectId={projectId} issueId={issueId} lockIssue />
					}
				/>
			</div>
		</div>
	);
};
