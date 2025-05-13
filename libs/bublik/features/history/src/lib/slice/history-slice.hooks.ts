/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';

import { BUBLIK_TAG, bublikAPI } from '@/services/bublik-api';
import { PROJECT_KEY } from '@/bublik/features/projects';

import { useHistoryQuery } from '../hooks';
import { useHistoryActions } from './history-slice';
import {
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

export const useSyncHistoryQueryToState = () => {
	const actions = useHistoryActions();
	const { query } = useHistoryQuery();

	useEffect(() => {
		const form = queryToHistorySearchState(query);
		actions.updateSearchForm(form);
	}, [actions, query]);
};

export const useHistoryFormSearchState = () => {
	const actions = useHistoryActions();
	const form = useSelector(selectHistoryForm);
	const state = useSelector(selectSearchState);
	const globalFilter = useSelector(selectGlobalFilter);
	const dispatch = useDispatch();

	const [searchParams, setSearchParams] = useSearchParams();

	const updateSearchParams = () => {
		const params = new URLSearchParams(historySearchStateToQuery(state));

		setSearchParams(params);
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
			const params = historySearchStateToQuery(formToSearchState(form));
			const newSearchParams = new URLSearchParams(params);

			newSearchParams.set('mode', mode);
			newSearchParams.set('page', String(1));
			newSearchParams.set('pageSize', String(pageSize));
			newSearchParams.delete(PROJECT_KEY);

			for (const [key, value] of searchParams) {
				if (key !== PROJECT_KEY) continue;
				newSearchParams.append(PROJECT_KEY, value);
			}

			setSearchParams(newSearchParams, { replace: true });
			actions.resetGlobalFilter();
			dispatch(bublikAPI.util.invalidateTags([BUBLIK_TAG.HistoryData]));
		},
		[actions, dispatch, mode, pageSize, searchParams, setSearchParams]
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
