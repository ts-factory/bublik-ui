/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import {
	IssuesTable,
	NewIssueButton
} from '@/bublik/features/result-classification';
import {
	useProjectSearch,
	useTabTitleWithPrefix
} from '@/bublik/features/projects';

export const IssuesPage = () => {
	const { projectIds } = useProjectSearch();

	useTabTitleWithPrefix('Issues - Bublik');

	return (
		<div className="flex flex-col h-full gap-1 p-2" data-testid="issues-page">
			<div className="flex flex-col flex-1 min-h-0 bg-white rounded">
				<IssuesTable
					toolbarActions={<NewIssueButton projectId={projectIds[0]} />}
				/>
			</div>
		</div>
	);
};
