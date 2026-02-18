/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { HistoryAPIQuery } from '@/shared/types';
import { formatTimeToDot } from '@/shared/utils';

import { LegendItem } from './history-filter-legend.component';
import { queryToHistorySearchState } from '../slice/history-slice.utils';

const normalizeLegendItemValue = (
	value?: LegendItem['value']
): LegendItem['value'] => {
	if (!value) return null;

	if (!Array.isArray(value)) {
		const trimmedValue = value.trim();

		return trimmedValue.length ? trimmedValue : null;
	}

	const normalizedArray = value
		.map((item) => item.trim())
		.filter((item) => item.length > 0);

	return normalizedArray.length ? normalizedArray : null;
};

const hasLegendItemValue = (item: LegendItem): boolean => {
	return normalizeLegendItemValue(item.value) !== null;
};

export const getLegendItems = (search: HistoryAPIQuery): LegendItem[] => {
	const state = queryToHistorySearchState(search);

	const formattedDate = `${formatTimeToDot(
		state.startDate.toISOString()
	)} — ${formatTimeToDot(state.finishDate.toISOString())}`;

	const items: LegendItem[] = [
		{
			iconName: 'Paper',
			iconSize: 24,
			label: 'Test Path',
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
			label: 'Obtained Result',
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
			label: 'Branches Expression',
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
			label: 'Revision Expression',
			value: state.revisionExpr
		},
		{
			iconName: 'PaperShort',
			iconSize: 24,
			label: 'Tags Expression',
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
			label: 'Result Type Classification',
			value: state.resultProperties
		},
		{
			iconName: 'PaperShort',
			iconSize: 24,
			label: 'Verdict Mode',
			value: state.verdictLookup
		},
		{
			iconName: 'PaperShort',
			iconSize: 24,
			label: 'Verdict Value',
			value: state.verdict
		},
		{
			iconName: 'PaperShort',
			iconSize: 24,
			label: 'Verdict Expression',
			value: state.verdictExpr
		},
		{
			iconName: 'PaperShort',
			iconSize: 24,
			label: 'Label Expression',
			value: state.labelExpr
		},
		{
			iconName: 'PaperShort',
			iconSize: 24,
			label: 'Parameters Expression',
			value: state.testArgExpr
		}
	];

	return items
		.map((item) => ({
			...item,
			value: normalizeLegendItemValue(item.value)
		}))
		.filter(hasLegendItemValue);
};
