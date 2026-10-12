/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useMount } from '@/shared/hooks';
import { RESULT_PROPERTIES, RESULT_TYPE } from '@/shared/types';
import { BUBLIK_TAG, bublikAPI } from '@/services/bublik-api';
import { useNavigateWithProject } from '@/bublik/features/projects';
import { parseSearch } from '@/router';

import { useHistoryQuery, useHistorySearch } from '../hooks';
import { useHistoryActions } from './history-slice';
import {
	HISTORY_SEARCH_KEY,
	formToSearchState,
	historySearchStateToQuery,
	queryToHistorySearchState
} from './history-slice.utils';
import {
	selectGlobalFilter,
	selectHistoryForm,
	selectSearchState
} from './history-slice.selectors';
import { HistoryGlobalSearchFormValues } from '../history-global-search-form';

export function getResultTypeState(
	results: string[],
	resultProperties: string[]
) {
	let isNotExpected = null;
	if (resultProperties.length === 1) {
		if (resultProperties[0] === RESULT_PROPERTIES.Expected) {
			isNotExpected = false;
		} else if (resultProperties[0] === RESULT_PROPERTIES.Unexpected) {
			isNotExpected = true;
		}
	}

	return {
		resultType: results.length === 1 ? (results[0] as RESULT_TYPE) : null,
		isNotExpected
	};
}

export const useSyncHistoryQueryToState = () => {
	const actions = useHistoryActions();
	const { query } = useHistoryQuery();

	useEffect(() => {
		const form = queryToHistorySearchState(query);
		actions.updateSearchForm(form);
	}, [actions, query]);

	useMount(() => {
		const form = queryToHistorySearchState(query);

		actions.updateLinearGlobalFilter({
			parameters: form.parameters,
			tags: form.runData,
			verdicts: form.verdict,
			...getResultTypeState(form.results, form.resultProperties)
		});
	});
};

export const useHistoryFormSearchState = () => {
	const actions = useHistoryActions();
	const form = useSelector(selectHistoryForm);
	const state = useSelector(selectSearchState);
	const globalFilter = useSelector(selectGlobalFilter);
	const dispatch = useDispatch();

	const navigateWithProject = useNavigateWithProject();
	const search = useHistorySearch((search) => search.search);

	const updateSearchParams = () => {
		const params = new URLSearchParams(historySearchStateToQuery(state));
		// Keep the substring filter: it is not part of the form being rebuilt.
		if (search) params.set(HISTORY_SEARCH_KEY, search);

		void navigateWithProject({
			to: '/history',
			search: parseSearch(params.toString()),
			replace: true
		});
	};

	const handleFormChange = useCallback(
		(form: HistoryGlobalSearchFormValues) => {
			actions.updateSearchForm(formToSearchState(form));
		},
		[actions]
	);

	const mode = useHistorySearch((search) => search.mode ?? 'linear');
	const pageSize = useHistorySearch((search) => search.pageSize ?? '25');

	const handleGlobalSearchSubmit = useCallback(
		(form: HistoryGlobalSearchFormValues) => {
			const params = historySearchStateToQuery(formToSearchState(form));
			const newSearchParams = new URLSearchParams(params);

			// Every key, the empty ones included, on `/history` (the v2 alias
			// collapses); `navigateWithProject` adds `_s`,
			// `hide-sidebar` and the selected projects.
			newSearchParams.set('mode', mode);
			newSearchParams.set('page', String(1));
			newSearchParams.set('pageSize', String(pageSize));
			if (search) newSearchParams.set(HISTORY_SEARCH_KEY, search);

			const searchString = newSearchParams.toString();
			void navigateWithProject({
				to: '/history',
				search: parseSearch(searchString),
				replace: true
			});
			actions.resetGlobalFilter();
			dispatch(bublikAPI.util.invalidateTags([BUBLIK_TAG.HistoryData]));
		},
		[actions, dispatch, mode, pageSize, search, navigateWithProject]
	);

	return {
		form,
		state,
		updateSearchParams,
		handleFormChange,
		handleGlobalSearchSubmit,
		globalFilter
	};
};
