/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { createSelector } from '@reduxjs/toolkit';

import { HISTORY_SLICE_NAME } from './history-slice';
import {
	AppStateWithHistorySlice,
	HistoryGlobalFilter,
	HistorySearchFormState
} from './history-slice.types';
import { RESULT_PROPERTIES } from '@/shared/types';
import {
	arrayToBadgeItem,
	badgeItemToArray,
	historySearchStateToForm
} from './history-slice.utils';
import { HistoryGlobalSearchFormValues } from '../history-global-search-form';
import {
	DEFAULT_RESULT_PROPERTIES,
	DEFAULT_RESULT_TYPES,
	DEFAULT_RUN_PROPERTIES
} from '@/bublik/config';

const selectHistorySliceState = (state: AppStateWithHistorySlice) => {
	return state[HISTORY_SLICE_NAME];
};

export const selectGlobalFilter = createSelector(
	selectHistorySliceState,
	(state) => state.globalFilter
);

export const selectSearchState = createSelector(
	selectHistorySliceState,
	(state) => state.searchForm
);

export const selectIsGlobalSearchFormOpen = createSelector(
	selectHistorySliceState,
	(state) => state.isGlobalSearchFormOpen
);

export const selectLinearGlobalFilter = createSelector(
	selectGlobalFilter,
	(filter) => ({
		tags: filter.tags,
		parameters: filter.parameters,
		verdicts: filter.verdicts,
		resultType: filter.resultType,
		isNotExpected: filter.isNotExpected,
		substringFilter: filter.substringFilter
	})
);

export const selectAggregationGlobalFilter = createSelector(
	selectGlobalFilter,
	(filter) => ({
		verdicts: filter.verdicts,
		parameters: filter.parameters,
		resultType: filter.resultType,
		isNotExpected: filter.isNotExpected,
		substringFilter: filter.substringFilter
	})
);

export const selectHistoryForm = createSelector(
	selectSearchState,
	selectGlobalFilter,
	(searchState, globalFilter) => getCombinedForm(searchState, globalFilter)
);

const getCombinedForm = (
	searchState: HistorySearchFormState,
	globalFilter: HistoryGlobalFilter
): HistoryGlobalSearchFormValues => {
	const formFromSearchState = historySearchStateToForm(searchState);

	const parameters = arrayToBadgeItem(
		Array.from(
			new Set([
				...badgeItemToArray(formFromSearchState.parameters),
				...globalFilter.parameters
			])
		)
	);

	const verdict = arrayToBadgeItem(
		Array.from(
			new Set([
				...badgeItemToArray(formFromSearchState.verdict),
				...globalFilter.verdicts
			])
		)
	);

	const runData = arrayToBadgeItem(
		Array.from(
			new Set([
				...badgeItemToArray(formFromSearchState.runData),
				...globalFilter.tags
			])
		)
	);

	const results = globalFilter.resultType
		? [globalFilter.resultType]
		: formFromSearchState.results.length
		? formFromSearchState.results
		: DEFAULT_RESULT_TYPES;

	const resultProperties =
		globalFilter.isNotExpected !== null
			? globalFilter.isNotExpected
				? [RESULT_PROPERTIES.Unexpected]
				: [RESULT_PROPERTIES.Expected]
			: formFromSearchState.resultProperties.length
			? formFromSearchState.resultProperties
			: DEFAULT_RESULT_PROPERTIES;

	const runProperties = formFromSearchState.runProperties.length
		? formFromSearchState.runProperties
		: DEFAULT_RUN_PROPERTIES;

	return {
		...formFromSearchState,
		parameters,
		verdict,
		runData,
		results,
		resultProperties,
		runProperties
	};
};
