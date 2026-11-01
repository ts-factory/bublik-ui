/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { ReactNode } from 'react';

import { ResultSelectionProvider } from '@/bublik/features/result-classification';

import { useHistoryQuery } from '../hooks';
import { historySelectionScope } from './history-selection.utils';

interface HistorySelectionProviderProps {
	children: ReactNode;
}

/**
 * The result selection of the history page, with its popover: the linear
 * rows a click picks, classified under one issue as on the run page. The
 * picks are kept per test and project; see `historySelectionScope`.
 */
function HistorySelectionProvider({ children }: HistorySelectionProviderProps) {
	const { query } = useHistoryQuery();

	return (
		<ResultSelectionProvider scope={historySelectionScope(query)}>
			{children}
		</ResultSelectionProvider>
	);
}

export { HistorySelectionProvider };
export type { HistorySelectionProviderProps };
