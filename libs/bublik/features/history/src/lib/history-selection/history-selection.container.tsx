/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';

import { ResultSelectionProvider } from '@/bublik/features/result-classification';

import { useHistoryQuery } from '../hooks';
import { useHistoryLinearRowsOnScreen } from '../history-linear/history-linear.hooks';
import { resolveHistoryMode } from '../history-mode-picker/history-mode';
import { historySelectionScope } from './history-selection.utils';

interface HistorySelectionProviderProps {
	children: ReactNode;
}

/**
 * The result selection of the history page, with its popover: the linear
 * rows a click picks, classified under one issue as on the run page. The
 * popover's Select All picks the rows listed on screen. The picks are kept
 * per test and project; see `historySelectionScope`.
 */
function HistorySelectionProvider({ children }: HistorySelectionProviderProps) {
	const { query } = useHistoryQuery();
	const [searchParams] = useSearchParams();
	const mode = resolveHistoryMode(searchParams.get('mode'));
	const linearRows = useHistoryLinearRowsOnScreen({ skip: mode !== 'linear' });

	return (
		<ResultSelectionProvider
			scope={historySelectionScope(query)}
			listed={mode === 'linear' ? linearRows : undefined}
			baseline={false}
		>
			{children}
		</ResultSelectionProvider>
	);
}

export { HistorySelectionProvider };
export type { HistorySelectionProviderProps };
