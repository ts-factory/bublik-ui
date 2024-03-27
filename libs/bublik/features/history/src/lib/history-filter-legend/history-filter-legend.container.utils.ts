/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { HistoryAPIQuery } from '@/shared/types';
import { formatTimeToDot } from '@/shared/utils';

import { LegendItem } from './history-filter-legend.component';
import { queryToHistorySearchState } from '../slice/history-slice.utils';

export const getLegendItems = (search: HistoryAPIQuery): LegendItem[] => {
	const state = queryToHistorySearchState(search);

	const formattedDate = `${formatTimeToDot(
		state.startDate.toISOString()
	)} — ${formatTimeToDot(state.finishDate.toISOString())}`;

	return [
		{
			iconName: 'Paper',
			iconSize: 24,
			label: 'Test name',
			value: state.testName
		},
		{
			iconName: 'Calendar',
			iconSize: 24,
			label: 'Date',
			value: formattedDate
		},
		{
			iconName: 'HashSymbol',
			iconSize: 24,
			label: 'Hash',
			value: state.hash
		},
		{
			iconName: 'BoxCheckmark',
			iconSize: 24,
			label: 'Obtained result',
			value: state.results
		},
		{
			iconName: 'PaperShort',
			iconSize: 24,
			label: 'Branches',
			value: state.branches
		},
		{
			iconName: 'PaperShort',
			iconSize: 24,
			label: 'Branches expression',
			value: state.branchExpr
		},
		{
			iconName: 'PaperShort',
			iconSize: 24,
			label: 'Revisions',
			value: state.revisions
		},
		{
			iconName: 'PaperShort',
			iconSize: 24,
			label: 'Revision expressions',
			value: state.revisionExpr
		},
		{
			iconName: 'PaperShort',
			iconSize: 24,
			label: 'Tags expressions',
			value: state.tagExpr
		},
		{
			iconName: 'PaperShort',
			iconSize: 24,
			label: 'Run',
			value: state.runProperties
		},
		{
			iconName: 'PaperShort',
			iconSize: 24,
			label: 'Result type classification',
			value: state.resultProperties
		},
		{
			iconName: 'PaperShort',
			iconSize: 24,
			label: 'Verdict mode',
			value: state.verdictLookup
		},
		{
			iconName: 'PaperShort',
			iconSize: 24,
			label: 'Verdict value',
			value: state.verdict
		},
		{
			iconName: 'PaperShort',
			iconSize: 24,
			label: 'Verdict expressions',
			value: state.verdictExpr
		},
		{
			iconName: 'PaperShort',
			iconSize: 24,
			label: 'Label expressions',
			value: state.labelExpr
		},
		{
			iconName: 'PaperShort',
			iconSize: 24,
			label: 'Parameters expression',
			value: state.testArgExpr
		}
	];
};
