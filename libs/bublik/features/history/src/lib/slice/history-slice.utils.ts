/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { parse } from 'date-fns';

import {
	API_DATE_FORMAT,
	DEFAULT_HISTORY_END_DATE,
	DEFAULT_HISTORY_START_DATE
} from '@/bublik/config';
import { HistoryAPIQuery, VERDICT_TYPE } from '@/shared/types';
import { BadgeItem } from '@/shared/tailwind-ui';
import { formatTimeToAPI } from '@/shared/utils';

import { HistoryGlobalSearchFormValues } from '../history-global-search-form';
import { HistorySearchFormState } from './history-slice.types';

export const parseArray = (str?: string) => {
	if (!str) return [];

	return str.split(';');
};

export const arrayToBadgeItem = (array: string[]): BadgeItem[] => {
	return array.map((value) => ({ id: value, value }));
};

export const badgeItemToArray = (items: BadgeItem[]): string[] => {
	return items.map((item) => item.value);
};

export const arrayToString = (array: string[]): string | undefined => {
	if (!array.length) return undefined;

	return array.join(';');
};

const withDefault = <T>(
	value: T,
	defaultVal: NonNullable<T>
): NonNullable<T> => {
	if (!value) return defaultVal;

	return value;
};

export const queryToHistorySearchState = (
	query: HistoryAPIQuery
): HistorySearchFormState => {
	const startDate = query.startDate
		? parse(query.startDate, API_DATE_FORMAT, new Date())
		: DEFAULT_HISTORY_START_DATE;

	const finishDate = query.finishDate
		? parse(query.finishDate, API_DATE_FORMAT, new Date())
		: DEFAULT_HISTORY_END_DATE;

	return {
		testArgExpr: withDefault(query.testArgExpr, ''),
		/* Test section */
		testName: withDefault(query.testName, ''),
		hash: withDefault(query.hash, ''),
		parameters: withDefault(parseArray(query.parameters), []),
		revisions: withDefault(parseArray(query.revisions), []),
		branches: withDefault(parseArray(query.branches), []),
		/* Run section */
		startDate,
		finishDate,
		runData: withDefault(parseArray(query.runData), []),
		tagExpr: withDefault(query.tagExpr, ''),
		branchExpr: withDefault(query.branchExpr, ''),
		verdictExpr: withDefault(query.verdictExpr, ''),
		revisionExpr: withDefault(query.revisionExpr, ''),
		labelExpr: withDefault(query.labelExpr, ''),
		/* Result section */
		runProperties: withDefault(parseArray(query.runProperties), []),
		resultProperties: withDefault(parseArray(query.resultProperties), []),
		results: withDefault(parseArray(query.results), []),
		/* Verdict section */
		verdictLookup: withDefault(query.verdictLookup, VERDICT_TYPE.String),
		verdict: withDefault(parseArray(query.verdict), [])
	};
};

export const historySearchStateToForm = (
	state: HistorySearchFormState
): HistoryGlobalSearchFormValues => {
	return {
		labelExpr: state.labelExpr,
		branchExpr: state.branchExpr,
		verdictExpr: state.verdictExpr,
		testArgExpr: state.testArgExpr,
		revisionExpr: state.revisionExpr,
		/* Test section */
		testName: state.testName,
		hash: state.hash,
		parameters: arrayToBadgeItem(state.parameters),
		revisions: arrayToBadgeItem(state.revisions),
		branches: arrayToBadgeItem(state.branches),
		/* Run section */
		runData: arrayToBadgeItem(state.runData),
		tagExpr: state.tagExpr,
		dates: { startDate: state.startDate, endDate: state.finishDate },
		/* Result section */
		resultProperties: state.resultProperties,
		runProperties: state.runProperties,
		results: state.results,
		/* Verdict section */
		verdictLookup: state.verdictLookup,
		verdict: arrayToBadgeItem(state.verdict)
	};
};

export const historySearchStateToQuery = (
	state: HistorySearchFormState
): HistoryAPIQuery => {
	return {
		/* Test section */
		testName: state.testName,
		hash: state.hash,
		parameters: withDefault(arrayToString(state.parameters), ''),
		revisions: withDefault(arrayToString(state.revisions), ''),
		branches: withDefault(arrayToString(state.branches), ''),
		/* Run section */
		runData: withDefault(arrayToString(state.runData), ''),
		tagExpr: withDefault(state.tagExpr, ''),
		branchExpr: withDefault(state.branchExpr, ''),
		labelExpr: withDefault(state.labelExpr, ''),
		testArgExpr: withDefault(state.testArgExpr, ''),
		revisionExpr: withDefault(state.revisionExpr, ''),
		verdictExpr: withDefault(state.verdictExpr, ''),
		startDate: formatTimeToAPI(state.startDate),
		finishDate: formatTimeToAPI(state.finishDate),
		/* Result section */
		resultProperties: withDefault(arrayToString(state.resultProperties), ''),
		runProperties: withDefault(arrayToString(state.runProperties), ''),
		results: withDefault(arrayToString(state.results), ''),
		/* Verdict section */
		verdictLookup: state.verdictLookup,
		verdict: withDefault(arrayToString(state.verdict), '')
	};
};

export const formToSearchState = (
	form: HistoryGlobalSearchFormValues
): Omit<HistorySearchFormState, 'page' | 'pageSize'> => {
	return {
		labelExpr: form.labelExpr,
		/* Test section */
		testName: form.testName,
		hash: form.hash,
		parameters: badgeItemToArray(form.parameters),
		revisions: badgeItemToArray(form.revisions),
		branches: badgeItemToArray(form.branches),
		/* Run section */
		startDate: form.dates.startDate,
		finishDate: form.dates.endDate,
		runData: badgeItemToArray(form.runData),
		tagExpr: form.tagExpr,
		revisionExpr: form.revisionExpr,
		testArgExpr: form.testArgExpr,
		verdictExpr: form.verdictExpr,
		branchExpr: form.branchExpr,
		/* Result section */
		runProperties: form.runProperties,
		resultProperties: form.resultProperties,
		results: form.results,
		/* Verdict section */
		verdictLookup: form.verdictLookup,
		verdict: badgeItemToArray(form.verdict)
	};
};
