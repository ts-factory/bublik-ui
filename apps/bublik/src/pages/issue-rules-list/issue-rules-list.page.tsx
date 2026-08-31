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

/**
 * Every rule, across issues and across projects — the cross-cutting view of
 * what the classifier will actually do to the next run. Same one-card shape as
 * the issues list: the table's toolbar is the card header.
 *
 * The project selector narrows rather than scopes. Unset, the table lists every
 * project's rules and bands them by project, because a rule *is* per-project
 * and showing only one project's silently hid the rest.
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
				<IssueRulesTable
				projectId={projectIds[0]}
				toolbarActions={<NewRuleButton projectId={projectIds[0]} />}
			/>
			</div>
		</div>
	);
};
