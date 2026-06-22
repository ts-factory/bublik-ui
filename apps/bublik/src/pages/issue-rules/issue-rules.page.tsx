/* SPDX-License-Identifier: Apache-2.0 */
import { useParams } from 'react-router-dom';

import { IssueRulesTable } from '@/bublik/features/result-classification';
import { useProjectSearch, LinkWithProject } from '@/bublik/features/projects';
import { Icon } from '@/shared/tailwind-ui';
import { BublikEmptyState } from '@/bublik/features/ui-state';

export const IssueRulesPage = () => {
	const { issueId } = useParams<{ issueId: string }>();
	const { projectIds } = useProjectSearch();
	const projectId = projectIds[0];

	if (!issueId) {
		return <BublikEmptyState title="No data" description="Issue ID is missing" />;
	}

	return (
		<div className="flex flex-col p-2">
			<header className="px-6 py-4 bg-white rounded-t-xl">
				<LinkWithProject
					to="/admin/issues"
					className="inline-flex items-center gap-1 text-sm text-text-menu hover:text-primary"
				>
					<Icon name="ArrowShortSmall" className="rotate-90" size={14} />
					Issues
				</LinkWithProject>
			</header>
			<main className="p-4 bg-white rounded-b-xl">
				<IssueRulesTable issueId={Number(issueId)} projectId={projectId} />
			</main>
		</div>
	);
};
