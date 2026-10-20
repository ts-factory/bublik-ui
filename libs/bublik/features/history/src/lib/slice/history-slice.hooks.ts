/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';

import { useMount } from '@/shared/hooks';
import { BUBLIK_TAG, bublikAPI } from '@/services/bublik-api';
import {
	PROJECT_KEY,
	useNavigateWithProject
} from '@/bublik/features/projects';

import { useHistoryQuery } from '../hooks';
import { useHistoryActions } from './history-slice';
import {
	copyHistorySearchParam,
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

	const [searchParams] = useSearchParams();
	const navigateWithProject = useNavigateWithProject();

	const updateSearchParams = () => {
		const params = new URLSearchParams(historySearchStateToQuery(state));
		copyHistorySearchParam(searchParams, params);

		navigateWithProject(
			{ pathname: '/history', search: `?${params.toString()}` },
			{ replace: true }
		);
	};

	const handleFormChange = useCallback(
		(form: HistoryGlobalSearchFormValues) => {
			actions.updateSearchForm(formToSearchState(form));
		},
		[actions]
	);

	const mode = searchParams.get('mode') ?? 'linear';
	const pageSize = searchParams.get('pageSize') ?? 25;

	const handleGlobalSearchSubmit = useCallback(
		(form: HistoryGlobalSearchFormValues) => {
			const searchState = formToSearchState(form);
			const params = historySearchStateToQuery(searchState);
			const newSearchParams = new URLSearchParams(params);

			newSearchParams.set('mode', mode);
			newSearchParams.set('page', String(1));
			newSearchParams.set('pageSize', String(pageSize));
			newSearchParams.delete(PROJECT_KEY);
			copyHistorySearchParam(searchParams, newSearchParams);

			for (const [key, value] of searchParams) {
				if (key !== PROJECT_KEY) continue;
				newSearchParams.append(PROJECT_KEY, value);
			}

			// Use navigateWithProject to properly preserve sidebar params
			const searchString = newSearchParams.toString();
			navigateWithProject(
				{
					pathname: '/history',
					search: searchString ? `?${searchString}` : ''
				},
				{ replace: true }
			);
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
		[actions, dispatch, mode, pageSize, searchParams, navigateWithProject]
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
