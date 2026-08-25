/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useParams } from 'react-router-dom';

import {
	IssueDetailHeader,
	IssueRulesTable
} from '@/bublik/features/result-classification';
import { useProjectSearch, LinkWithProject } from '@/bublik/features/projects';
import { CardHeader, Icon } from '@/shared/tailwind-ui';
import { BublikEmptyState } from '@/bublik/features/ui-state';

export const IssueRulesPage = () => {
	const { issueId } = useParams<{ issueId: string }>();
	const { projectIds } = useProjectSearch();
	const projectId = projectIds[0];

	if (!issueId) {
		return (
			<BublikEmptyState title="No data" description="Issue ID is missing" />
		);
	}

	return (
		<div className="flex flex-col gap-1 p-2" data-testid="issue-rules-page">
			<header className="flex flex-col bg-white rounded">
				<CardHeader label="Info">
					<LinkWithProject
						to="/admin/issues"
						className="inline-flex items-center gap-1 text-xs text-text-menu hover:text-primary"
					>
						<Icon name="ArrowShortSmall" className="rotate-90" size={14} />
						All issues
					</LinkWithProject>
				</CardHeader>
				<IssueDetailHeader issueId={Number(issueId)} projectId={projectId} />
			</header>
			<div className="flex flex-col bg-white rounded">
				<CardHeader label="Rules" />
				<IssueRulesTable issueId={Number(issueId)} projectId={projectId} />
			</div>
		</div>
	);
};
