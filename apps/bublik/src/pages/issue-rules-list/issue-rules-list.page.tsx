/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import {
	IssueRulesTable,
	NewRuleButton
} from '@/bublik/features/result-classification';
import {
	useProjectSearch,
	useTabTitleWithPrefix
} from '@/bublik/features/projects';

export const IssueRulesListPage = () => {
	const { projectIds } = useProjectSearch();

	useTabTitleWithPrefix('Rules - Issues - Bublik');

	return (
		<div
			className="flex flex-col h-full gap-1 p-2"
			data-testid="issue-rules-list-page"
		>
			<div className="flex flex-col flex-1 min-h-0 bg-white rounded">
				<IssueRulesTable
					projectId={projectIds[0]}
					toolbarActions={<NewRuleButton projectId={projectIds[0]} />}
				/>
			</div>
		</div>
	);
};
