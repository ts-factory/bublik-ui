/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useMount } from '@/shared/hooks';
import { BUBLIK_TAG, bublikAPI } from '@/services/bublik-api';
import { useNavigateWithProject } from '@/bublik/features/projects';
import { parseSearch } from '@/router';

import { useHistoryQuery, useHistorySearch } from '../hooks';
import { useHistoryActions } from './history-slice';
import {
	HISTORY_SEARCH_KEY,
	formToSearchState,
	getResultTypeState,
	historySearchStateToQuery,
	queryToHistorySearchState
} from './history-slice.utils';
import {
	getCombinedForm,
	selectGlobalFilter,
	selectSearchState
} from './history-slice.selectors';
import { HistoryGlobalSearchFormValues } from '../history-global-search-form';

export { getResultTypeState };

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
	const state = useSelector(selectSearchState);
	const globalFilter = useSelector(selectGlobalFilter);
	const { query } = useHistoryQuery();
	const applied = useMemo(() => queryToHistorySearchState(query), [query]);
	const form = useMemo(
		() => getCombinedForm(state, globalFilter, applied),
		[state, globalFilter, applied]
	);
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
			const searchState = formToSearchState(form);
			const params = historySearchStateToQuery(searchState);
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
			// The badge selection starts as what the URL now applies, so that
			// deselecting a badge later drops it from the search
			actions.updateLinearGlobalFilter({
				parameters: searchState.parameters,
				tags: searchState.runData,
				verdicts: searchState.verdict,
				...getResultTypeState(searchState.results, searchState.resultProperties)
			});
			dispatch(bublikAPI.util.invalidateTags([BUBLIK_TAG.HistoryData]));
		},
		[actions, dispatch, mode, pageSize, search, navigateWithProject]
	);

	return {
		form,
		state,
		applied,
		updateSearchParams,
		handleFormChange,
		handleGlobalSearchSubmit,
		globalFilter
	};
};
