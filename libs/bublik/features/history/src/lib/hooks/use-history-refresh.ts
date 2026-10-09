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

import {
	HistoryGlobalFilter,
	HistorySearchFormState,
	useHistoryActions,
	useHistoryFormSearchState
} from '../slice';
import {
	applyBadgeSelection,
	arrayToString,
	HISTORY_SEARCH_KEY,
	historySearchStateToQuery,
	isResultSelectionCleared
} from '../slice/history-slice.utils';
import { useHistorySearch } from './use-history-search';

const globalFilterToQueryAdapter = (
	globalFilter: HistoryGlobalFilter,
	state: HistorySearchFormState,
	applied: HistorySearchFormState
): HistoryAPIQuery => {
	const { isNotExpected, resultType } = globalFilter;
	const query = historySearchStateToQuery(state);
	const isResultCleared = isResultSelectionCleared(applied, globalFilter);

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

		if (!isResultCleared && query.resultProperties?.length) {
			return query.resultProperties.split(';') as RESULT_PROPERTIES[];
		}

		return DEFAULT_RESULT_PROPERTIES;
	};

	const getResultType = (): RESULT_TYPE[] => {
		if (resultType) return [resultType];
		if (!isResultCleared && query.results?.length)
			return query.results.split(';') as RESULT_TYPE[];

		return DEFAULT_RESULT_TYPES;
	};

	const { tags, parameters, verdicts } = getSubmittedBadges(
		globalFilter,
		state,
		applied
	);

	return {
		...query,
		results: getResultType().join(';'),
		resultProperties: getResultProperties().join(';'),
		runData: arrayToString(tags) ?? '',
		parameters: arrayToString(parameters) ?? '',
		verdict: arrayToString(verdicts) ?? '',
		page: '1'
	};
};

const getSubmittedBadges = (
	globalFilter: HistoryGlobalFilter,
	state: HistorySearchFormState,
	applied: HistorySearchFormState
): Pick<HistoryGlobalFilter, 'tags' | 'parameters' | 'verdicts'> => ({
	tags: applyBadgeSelection(state.runData, applied.runData, globalFilter.tags),
	parameters: applyBadgeSelection(
		state.parameters,
		applied.parameters,
		globalFilter.parameters
	),
	verdicts: applyBadgeSelection(
		state.verdict,
		applied.verdict,
		globalFilter.verdicts
	)
});

export const useHistoryRefresh = () => {
	const { state, applied } = useHistoryFormSearchState();
	const actions = useHistoryActions();
	const mode = useHistorySearch((search) => search.mode ?? 'linear');
	const pageSize = useHistorySearch((search) => search.pageSize ?? '25');
	const search = useHistorySearch((search) => search.search);
	const dispatch = useDispatch();
	const navigateWithProject = useNavigateWithProject();

	return useCallback(
		(globalFilter: HistoryGlobalFilter) => {
			const newQuery = globalFilterToQueryAdapter(globalFilter, state, applied);

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
			// Badges submitted from the form are now applied, so select them too
			actions.updateLinearGlobalFilter({
				...globalFilter,
				...getSubmittedBadges(globalFilter, state, applied)
			});
			dispatch(bublikAPI.util.invalidateTags([BUBLIK_TAG.HistoryData]));
		},
		[
			actions,
			applied,
			dispatch,
			mode,
			pageSize,
			search,
			navigateWithProject,
			state
		]
	);
};
