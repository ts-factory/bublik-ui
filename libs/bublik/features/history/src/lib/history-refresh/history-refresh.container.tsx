/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useCallback } from 'react';

import { useHistoryFormSearchState } from '../slice';
import { useHistoryRefresh } from '../hooks';
import { HistoryRefresh } from './history-refresh.component';

export const HistoryRefreshContainer = () => {
	const { globalFilter } = useHistoryFormSearchState();
	const refresh = useHistoryRefresh();

	const handleRefreshClick = useCallback(
		() => refresh(globalFilter),
		[globalFilter, refresh]
	);

	return <HistoryRefresh onRefreshClick={handleRefreshClick} />;
};
