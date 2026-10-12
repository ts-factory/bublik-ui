/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useMemo } from 'react';

import { HistoryAPIBackendQuery } from '@/shared/types';

import { searchQueryToBackendQuery } from '../slice/history-slice.utils';
import { historySearchToQuery, useHistorySearch } from './use-history-search';

export const useHistoryQuery = () => {
	const search = useHistorySearch(historySearchToQuery);

	const query = useMemo<HistoryAPIBackendQuery>(
		() => searchQueryToBackendQuery(search),
		[search]
	);

	return { query };
};
