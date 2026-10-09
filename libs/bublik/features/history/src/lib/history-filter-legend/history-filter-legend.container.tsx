/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useMemo } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';

import { Issue } from '@/shared/types';
import { useGetIssueQuery } from '@/services/bublik-api';
import { useProjectSearch } from '@/bublik/features/projects';
import { BugKeyChip } from '@/bublik/features/result-classification';

import { useHistoryQuery } from '../hooks';
import { getLegendItems } from './history-filter-legend.container.utils';
import { HistoryFilterLegend } from './history-filter-legend.component';

interface IssueLegendValueProps {
	issue: Issue;
}

/** The issue as the history rows show it, rather than its bare id. */
const IssueLegendValue = ({ issue }: IssueLegendValueProps) => {
	return (
		<div className="flex items-center gap-1.5 min-w-0">
			<BugKeyChip
				bugKey={issue.bug_key}
				bugUrl={issue.bug_url}
				issueId={issue.id}
				fallback={`#${issue.id}`}
				closed={issue.state === 'closed'}
				description={issue.title}
				className="max-w-[12rem]"
			/>
			<span className="text-[0.6875rem] leading-[0.875rem] text-text-secondary truncate max-w-[20rem]">
				{issue.title}
			</span>
		</div>
	);
};

export const HistoryFilterLegendContainer = () => {
	const { query } = useHistoryQuery();
	const issueId =
		query.issue && /^\d+$/.test(query.issue) ? Number(query.issue) : null;
	const { projectIds } = useProjectSearch();
	// Until it loads, or if it cannot, the legend falls back to the bare id
	const { currentData: issue } = useGetIssueQuery(
		issueId !== null ? { issueId, projectId: projectIds[0] } : skipToken
	);

	const legendItems = useMemo(
		() =>
			getLegendItems(query, {
				issue: issue ? <IssueLegendValue issue={issue} /> : undefined
			}),
		[query, issue]
	);

	return <HistoryFilterLegend items={legendItems} />;
};
