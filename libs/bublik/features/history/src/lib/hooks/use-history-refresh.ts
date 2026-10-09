/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import {
	HistoryAPIQuery,
	RESULT_PROPERTIES,
	RESULT_TYPE
} from '@/shared/types';
import { BUBLIK_TAG, bublikAPI } from '@/services/bublik-api';
import {
	DEFAULT_RESULT_PROPERTIES,
	DEFAULT_RESULT_TYPES
} from '@/bublik/config';

import { useNavigateWithProject } from '@/bublik/features/projects';

import { HistoryGlobalFilter, useHistoryFormSearchState } from '../slice';
import {
	HISTORY_SEARCH_KEY,
	historySearchStateToQuery
} from '../slice/history-slice.utils';
import { useHistorySearch } from './use-history-search';

const globalFilterToQueryAdapter = (
	globalFilter: HistoryGlobalFilter,
	query: HistoryAPIQuery
): HistoryAPIQuery => {
	const { verdicts, isNotExpected, parameters, resultType, tags } =
		globalFilter;

	const getResultProperties = (): RESULT_PROPERTIES[] => {
		if (resultType != null || isNotExpected != null) {
			const resultProperties: RESULT_PROPERTIES[] = [];
			const isNotRun =
				resultType === RESULT_TYPE.Skipped ||
				resultType === RESULT_TYPE.Killed ||
				resultType === RESULT_TYPE.Incomplete;

			if (isNotExpected) resultProperties.push(RESULT_PROPERTIES.Unexpected);
			if (!isNotExpected) resultProperties.push(RESULT_PROPERTIES.Expected);
			if (isNotRun) resultProperties.push(RESULT_PROPERTIES.NotRun);

			return resultProperties;
		}

		if (query.resultProperties?.length) {
			return query.resultProperties.split(';') as RESULT_PROPERTIES[];
		}

		return DEFAULT_RESULT_PROPERTIES;
	};

	const getResultType = (): RESULT_TYPE[] => {
		if (resultType) return [resultType];
		if (query.results?.length) return query.results.split(';') as RESULT_TYPE[];

		return DEFAULT_RESULT_TYPES;
	};

	const mergeWithPriority = (
		globalFilterValue: string[],
		queryValue: string | undefined
	) => {
		if (globalFilterValue.length) return globalFilterValue.join(';');
		if (queryValue?.length) return queryValue;
		return '';
	};

	return {
		...query,
		results: getResultType().join(';'),
		resultProperties: getResultProperties().join(';'),
		runData: mergeWithPriority(tags, query.runData),
		parameters: mergeWithPriority(parameters, query.parameters),
		verdict: mergeWithPriority(verdicts, query.verdict),
		page: '1'
	};
};
export const useHistoryRefresh = () => {
	const { state } = useHistoryFormSearchState();
	const mode = useHistorySearch((search) => search.mode ?? 'linear');
	const pageSize = useHistorySearch((search) => search.pageSize ?? '25');
	const search = useHistorySearch((search) => search.search);
	const dispatch = useDispatch();
	const navigateWithProject = useNavigateWithProject();

	return useCallback(
		(globalFilter: HistoryGlobalFilter) => {
			const newQuery = globalFilterToQueryAdapter(
				globalFilter,
				historySearchStateToQuery(state)
			);

			// Every key, the empty ones included; `navigateWithProject` adds
			// `_s`, `hide-sidebar` and the selected projects.
			const params = new URLSearchParams(newQuery);
			params.set('mode', mode);
			params.set('page', String(1));
			params.set('pageSize', String(pageSize));
			// Keep the substring filter: it is not part of the form being rebuilt.
			if (search) params.set(HISTORY_SEARCH_KEY, search);

			const searchString = params.toString();
			navigateWithProject(
				{
					pathname: '/history',
					search: searchString ? `?${searchString}` : ''
				},
				{ replace: true }
			);
			dispatch(bublikAPI.util.invalidateTags([BUBLIK_TAG.HistoryData]));
		},
		[dispatch, mode, pageSize, search, navigateWithProject, state]
	);
};
