/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { IssueRulesTable } from '@/bublik/features/result-classification';
import {
	useProjectSearch,
	useTabTitleWithPrefix
} from '@/bublik/features/projects';

/**
 * Every rule in the project, across issues — the cross-cutting view of what the
 * classifier will actually do to the next run. Same one-card shape as the
 * issues list: the table's toolbar is the card header.
 */
export const IssueRulesListPage = () => {
	const { projectIds } = useProjectSearch();

	useTabTitleWithPrefix('Rules - Issues - Bublik');

	return (
		<div
			className="flex flex-col h-full gap-1 p-2"
			data-testid="issue-rules-list-page"
		>
			<div className="flex flex-col flex-1 min-h-0 bg-white rounded">
				<IssueRulesTable projectId={projectIds[0]} />
			</div>
		</div>
	);
};
