/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';

import { useMount } from '@/shared/hooks';
import { RESULT_PROPERTIES, RESULT_TYPE } from '@/shared/types';
import { BUBLIK_TAG, bublikAPI } from '@/services/bublik-api';
import {
	PROJECT_KEY,
	useNavigateWithProject
} from '@/bublik/features/projects';

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

	const [searchParams] = useSearchParams();
	const navigateWithProject = useNavigateWithProject();

	const updateSearchParams = () => {
		const params = new URLSearchParams(historySearchStateToQuery(state));

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

			// Use navigateWithProject to properly preserve sidebar params
			const searchString = newSearchParams.toString();
			navigateWithProject(
				{
					pathname: '/history',
					search: searchString ? `?${searchString}` : ''
				},
				{ replace: true }
			);
			actions.resetGlobalFilter();
			dispatch(bublikAPI.util.invalidateTags([BUBLIK_TAG.HistoryData]));
		},
		[actions, dispatch, mode, pageSize, searchParams, navigateWithProject]
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
