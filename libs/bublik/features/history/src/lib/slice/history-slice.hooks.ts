/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

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
import { useSearchParams } from 'react-router-dom';
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

			setSearchParams(newSearchParams, { replace: true });
			actions.resetGlobalFilter();
		},
		[actions, mode, pageSize, setSearchParams]
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
