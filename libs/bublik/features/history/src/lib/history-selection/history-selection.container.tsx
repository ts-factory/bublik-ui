/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';

import { ResultSelectionProvider } from '@/bublik/features/result-classification';

import { useHistoryQuery } from '../hooks';
import { useHistoryLinearRowsOnScreen } from '../history-linear/history-linear.hooks';
import { useHistoryAggregationResultsOnScreen } from '../history-aggregation/history-aggregation.hooks';
import { resolveHistoryMode } from '../history-mode-picker/history-mode';
import { historySelectionScope } from './history-selection.utils';

interface HistorySelectionProviderProps {
	children: ReactNode;
}

/**
 * The result selection of the history page, with its popover: the linear
 * rows, or the verdict groups of the group-of-results mode, a click picks,
 * classified under one issue as on the run page. The popover's Select All
 * picks the results listed on screen. The picks are kept
 * per test and project; see `historySelectionScope`.
 */
function HistorySelectionProvider({ children }: HistorySelectionProviderProps) {
	const { query } = useHistoryQuery();
	const [searchParams] = useSearchParams();
	const mode = resolveHistoryMode(searchParams.get('mode'));
	const linearRows = useHistoryLinearRowsOnScreen({ skip: mode !== 'linear' });
	const aggregationResults = useHistoryAggregationResultsOnScreen({
		skip: mode !== 'aggregation'
	});
	const listed =
		mode === 'linear'
			? linearRows
			: mode === 'aggregation'
			? aggregationResults
			: undefined;

	return (
		<ResultSelectionProvider
			scope={historySelectionScope(query)}
			listed={listed}
			baseline={false}
		>
			{children}
		</ResultSelectionProvider>
	);
}

export { HistorySelectionProvider };
export type { HistorySelectionProviderProps };
