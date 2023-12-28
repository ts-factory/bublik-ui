/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	bindActionCreators,
	createSlice,
	PayloadAction
} from '@reduxjs/toolkit';
import { useMemo } from 'react';
import { useDispatch } from 'react-redux';

import {
	DEFAULT_HISTORY_END_DATE,
	DEFAULT_HISTORY_START_DATE,
	DEFAULT_RESULT_PROPERTIES,
	DEFAULT_RESULT_TYPES,
	DEFAULT_RUN_PROPERTIES,
	DEFAULT_VERDICT_LOOKUP
} from '@/bublik/config';

import { HistoryGlobalFilter, HistorySliceState } from './history-slice.types';

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export const HISTORY_SLICE_NAME = 'history';

export const DEFAULT_GLOBAL_FILTER: HistorySliceState['globalFilter'] = {
	tags: [],
	parameters: [],
	verdicts: [],
	resultType: null,
	isNotExpected: null,
	substringFilter: ''
};

export const DEFAULT_SEARCH_FORM_STATE: HistorySliceState['searchForm'] = {
	/* Test section */
	testName: '',
	labelExpr: '',
	hash: '',
	parameters: [],
	revisions: [],
	branches: [],
	/* Run section */
	startDate: DEFAULT_HISTORY_START_DATE,
	finishDate: DEFAULT_HISTORY_END_DATE,
	runData: [],
	tagExpr: '',
	/* Result section */
	runProperties: DEFAULT_RUN_PROPERTIES,
	resultProperties: DEFAULT_RESULT_PROPERTIES,
	results: DEFAULT_RESULT_TYPES,
	/* Verdict section */
	verdictLookup: DEFAULT_VERDICT_LOOKUP,
	verdict: [],
	revisionExpr: '',
	testArgExpr: '',
	verdictExpr: '',
	branchExpr: ''
};

const initialState: HistorySliceState = {
	isGlobalSearchFormOpen: false,
	globalFilter: DEFAULT_GLOBAL_FILTER,
	searchForm: DEFAULT_SEARCH_FORM_STATE
};

const historySlice = createSlice({
	name: HISTORY_SLICE_NAME,
	initialState,
	reducers: {
		initGlobalFilter: (
			state,
			action: PayloadAction<
				PartialBy<
					Omit<HistoryGlobalFilter, 'substringFilter'>,
					'isNotExpected' | 'resultType'
				>
			>
		) => {
			const { parameters, tags, verdicts, resultType, isNotExpected } =
				action.payload;

			state.globalFilter = {
				...state.globalFilter,
				resultType: resultType ?? null,
				isNotExpected: isNotExpected ?? null,
				parameters,
				tags,
				verdicts
			};
		},
		updateLinearGlobalFilter: (
			state,
			action: PayloadAction<Omit<HistoryGlobalFilter, 'substringFilter'>>
		) => {
			state.globalFilter = {
				...action.payload,
				substringFilter: state.globalFilter.substringFilter
			};
		},
		updateAggregationGlobalFilter: (
			state,
			action: PayloadAction<
				Omit<HistoryGlobalFilter, 'substringFilter' | 'tags'>
			>
		) => {
			state.globalFilter = {
				...action.payload,
				tags: state.globalFilter.tags,
				substringFilter: state.globalFilter.substringFilter
			};
		},
		updateSubstringFilter: (state, action: PayloadAction<string>) => {
			state.globalFilter.substringFilter = action.payload;
		},
		resetGlobalFilter: (state) => {
			state.globalFilter = DEFAULT_GLOBAL_FILTER;
		},
		resetSearchForm: (state) => {
			state.searchForm = {
				...DEFAULT_SEARCH_FORM_STATE,
				startDate: state.searchForm.startDate,
				finishDate: state.searchForm.finishDate,
				testName: state.searchForm.testName
			};
		},
		toggleIsGlobalSearchOpen: (state, action: PayloadAction<boolean>) => {
			state.isGlobalSearchFormOpen = action.payload;
		},
		updateSearchForm: (
			state,
			action: PayloadAction<HistorySliceState['searchForm']>
		) => {
			Object.assign(state.searchForm, action.payload);
		},
		initSearchForm: (
			state,
			action: PayloadAction<HistorySliceState['searchForm']>
		) => {
			Object.assign(state.searchForm, action.payload);
		}
	}
});

export const historySliceReducer = historySlice.reducer;

export const useHistoryActions = () => {
	const dispatch = useDispatch();

	return useMemo(
		() => bindActionCreators(historySlice.actions, dispatch),
		[dispatch]
	);
};
