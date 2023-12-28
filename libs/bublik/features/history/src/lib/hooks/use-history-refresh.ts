/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
	HistoryAPIQuery,
	RESULT_PROPERTIES,
	RESULT_TYPE
} from '@/shared/types';
import {
	DEFAULT_RESULT_PROPERTIES,
	DEFAULT_RESULT_TYPES
} from '@/bublik/config';

import { HistoryGlobalFilter, useHistoryFormSearchState } from '../slice';
import { historySearchStateToQuery } from '../slice/history-slice.utils';

const globalFilterToQueryAdapter = (
	globalFilter: HistoryGlobalFilter,
	query: HistoryAPIQuery
): HistoryAPIQuery => {
	const { verdicts, isNotExpected, parameters, resultType, tags } =
		globalFilter;

	const getResultProperties = (): RESULT_PROPERTIES[] => {
		const resultProperties: RESULT_PROPERTIES[] = [];

		if (resultType == null && isNotExpected == null) {
			return DEFAULT_RESULT_PROPERTIES;
		}

		const isNotRun =
			resultType === RESULT_TYPE.Skipped ||
			resultType === RESULT_TYPE.Killed ||
			resultType === RESULT_TYPE.Incomplete;

		if (isNotExpected) {
			resultProperties.push(RESULT_PROPERTIES.Unexpected);
		}

		if (!isNotExpected) {
			resultProperties.push(RESULT_PROPERTIES.Expected);
		}

		if (isNotRun) resultProperties.push(RESULT_PROPERTIES.NotRun);

		return resultProperties;
	};

	const getResultType = (): RESULT_TYPE[] => {
		if (!resultType) return DEFAULT_RESULT_TYPES;

		return [resultType];
	};

	return {
		...query,
		results: getResultType().join(';'),
		resultProperties: getResultProperties().join(';'),
		runData: tags.join(';'),
		parameters: parameters.join(';'),
		verdict: encodeURIComponent(verdicts.join(';')),
		page: '1'
	};
};

export const useHistoryRefresh = () => {
	const { state } = useHistoryFormSearchState();
	const [searchParams, setSearchParams] = useSearchParams();
	const mode = searchParams.get('mode') ?? 'linear';
	const pageSize = searchParams.get('pageSize') ?? 25;

	return useCallback(
		(globalFilter: HistoryGlobalFilter) => {
			const newQuery = globalFilterToQueryAdapter(
				globalFilter,
				historySearchStateToQuery(state)
			);

			const params = new URLSearchParams(newQuery);
			params.set('mode', mode);
			params.set('page', String(1));
			params.set('pageSize', String(pageSize));
			setSearchParams(params);
		},
		[mode, pageSize, setSearchParams, state]
	);
};
