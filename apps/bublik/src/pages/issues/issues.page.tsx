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

/**
 * One card, one bar. The table's own toolbar is the card header — it already
 * carries the "Issues" label, the filters and the scope summary, and stacking a
 * `CardHeader` above it only bought a second row of chrome saying the same
 * word. `h-full` down the chain is what lets the table body scroll under a
 * pinned header and footer instead of the whole page scrolling.
 */
export const IssuesPage = () => {
	const { projectIds } = useProjectSearch();

	useTabTitleWithPrefix('Issues - Bublik');

	return (
		<div className="flex flex-col h-full gap-1 p-2" data-testid="issues-page">
			<div className="flex flex-col flex-1 min-h-0 bg-white rounded">
				{/* An issue is global — the project only scopes which rules count
			    towards it — so the selector is passed through for the write's
			    permission check rather than to file the issue anywhere. */}
			<IssuesTable
				toolbarActions={<NewIssueButton projectId={projectIds[0]} />}
			/>
			</div>
		</div>
	);
};
