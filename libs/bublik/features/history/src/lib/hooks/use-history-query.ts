/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { HistoryAPIBackendQuery } from '@/shared/types';

import { searchQueryToBackendQuery } from '../slice/history-slice.utils';

export const useHistoryQuery = () => {
	const [searchParams] = useSearchParams();

	const query = useMemo<HistoryAPIBackendQuery>(() => {
		const rawQuery = Object.fromEntries(
			searchParams.entries()
		) as HistoryAPIBackendQuery;

		return searchQueryToBackendQuery(rawQuery);
	}, [searchParams]);

	return { query };
};
