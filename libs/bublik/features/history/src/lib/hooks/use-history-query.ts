/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { camelizeKeys } from 'humps';

import { HistoryAPIQuery } from '@/shared/types';

export const useHistoryQuery = () => {
	const [searchParams] = useSearchParams();

	const query = useMemo(() => {
		const rawQuery = camelizeKeys(
			Object.fromEntries(searchParams.entries())
		) as HistoryAPIQuery;

		rawQuery.verdict = decodeURIComponent(rawQuery.verdict || '');

		return rawQuery;
	}, [searchParams]);

	return { query };
};
