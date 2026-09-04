/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useParams } from 'react-router-dom';
import { skipToken } from '@reduxjs/toolkit/query';

import {
	IssueDetailHeader,
	IssueHeaderBar,
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

import { BublikEmptyState } from '@/bublik/features/ui-state';

export const IssuePage = () => {
	const { issueId } = useParams<{ issueId: string }>();
	const { projectIds } = useProjectSearch();
	const navigate = useNavigateWithProject();
	const projectId = projectIds[0];

	// `/issues/rules` also matches the `/issues/:issueId` pattern in matchPath —
	// route ranking keeps it off this component, but a hand-typed or stale
	// non-numeric id would otherwise reach the API as `NaN`.
	const isValidId = !!issueId && /^\d+$/.test(issueId);
	const numericIssueId = isValidId ? Number(issueId) : undefined;

	const { data: issue } = useGetIssueQuery(
		numericIssueId !== undefined
			? { issueId: numericIssueId, projectId }
			: skipToken
	);

	useTabTitleWithPrefix([issue?.title, 'Issue - Bublik']);

	if (numericIssueId === undefined) {
		return (
			<BublikEmptyState
				title="No data"
				description="Issue ID is missing or invalid"
			/>
		);
	}

	return (
		<div className="flex flex-col h-full gap-1 p-2" data-testid="issue-page">
			<header className="flex flex-col bg-white rounded shrink-0">
				{/* The bar names the issue, says whether it is open, and carries
				    every control that acts on it. It used to say `Info`, which named
				    the card rather than the thing the page is about. */}
				<IssueHeaderBar
					issueId={numericIssueId}
					projectId={projectId}
					// The page is about an issue that no longer exists.
					onDeleted={() => navigate(routes.issues({}))}
				>
					<CopyShortUrlButtonContainer />
				</IssueHeaderBar>
				<IssueDetailHeader
					issueId={numericIssueId}
					projectId={projectId}
				/>
			</header>
			<div className="flex flex-col flex-1 min-h-0 bg-white rounded">
				<IssueRulesTable
					issueId={numericIssueId}
					projectId={projectId}
					toolbarActions={
						<NewRuleButton
							projectId={projectId}
							issueId={numericIssueId}
							lockIssue
						/>
					}
				/>
			</div>
		</div>
	);
};
