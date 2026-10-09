/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { isValid, parse } from 'date-fns';

import {
	API_DATE_FORMAT,
	config,
	getDefaultHistoryDateRange
} from '@/bublik/config';
import {
	HistoryAPIBackendQuery,
	HistoryAPIQuery,
	RESULT_PROPERTIES,
	RESULT_TYPE,
	VERDICT_TYPE
} from '@/shared/types';
import { BadgeItem } from '@/shared/tailwind-ui';
import { formatTimeToAPI } from '@/shared/utils';

import { HistoryGlobalSearchFormValues } from '../history-global-search-form';
import {
	HistoryGlobalFilter,
	HistorySearchFormState
} from './history-slice.types';

/** URL key of the server-side substring search, owned by the substring filter */
export const HISTORY_SEARCH_KEY = 'search';

/** Keep the substring search when a writer rebuilds the history query */
export const copyHistorySearchParam = (
	from: URLSearchParams,
	to: URLSearchParams
): void => {
	const search = from.get(HISTORY_SEARCH_KEY);

	if (search) to.set(HISTORY_SEARCH_KEY, search);
};

export const parseArray = (str?: string) => {
	if (!str) return [];

	return str.split(config.queryDelimiter);
};

export const arrayToBadgeItem = (array: string[]): BadgeItem[] => {
	return array.map((value) => ({ id: value, value }));
};

export const badgeItemToArray = (items: BadgeItem[]): string[] => {
	return items.map((item) => item.value);
};

/**
 * Apply the table's badge selection to a list from the search form.
 *
 * The selection starts as the list the URL applied, so a value the URL applied
 * that is no longer selected was deselected in the table and leaves the search.
 */
export const applyBadgeSelection = (
	values: string[],
	applied: string[],
	selected: string[]
): string[] => {
	const deselected = applied.filter((value) => !selected.includes(value));

	return Array.from(
		new Set([
			...values.filter((value) => !deselected.includes(value)),
			...selected
		])
	);
};

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

/**
 * Whether the table deselected the obtained result badge the URL applied.
 *
 * The badge sets the result type and its expectation together, so clearing it
 * drops both from the search rather than falling back to the URL's values.
 */
export const isResultSelectionCleared = (
	applied: HistorySearchFormState,
	globalFilter: HistoryGlobalFilter
): boolean => {
	const { resultType } = getResultTypeState(
		applied.results,
		applied.resultProperties
	);

	return resultType !== null && globalFilter.resultType === null;
};

export const arrayToString = (array: string[]): string | undefined => {
	if (!array.length) return undefined;

	return array.join(config.queryDelimiter);
};

const withDefault = <T>(
	value: T,
	defaultVal: NonNullable<T>
): NonNullable<T> => {
	if (!value) return defaultVal;

	return value;
};

export const queryToHistorySearchState = (
	query: HistoryAPIBackendQuery
): HistorySearchFormState => {
	const defaultDates = getDefaultHistoryDateRange();
	const startDate = query.fromDate
		? parse(query.fromDate, API_DATE_FORMAT, new Date())
		: defaultDates.startDate;

	const finishDate = query.toDate
		? parse(query.toDate, API_DATE_FORMAT, new Date())
		: defaultDates.finishDate;

	return {
		labels: withDefault(parseArray(query.labels), []),
		testArgExpr: withDefault(query.testArgExpr, ''),
		/* Test section */
		testName: withDefault(query.testName, ''),
		hash: withDefault(query.hash, ''),
		parameters: withDefault(parseArray(query.testArgs), []),
		revisions: withDefault(parseArray(query.revisions), []),
		branches: withDefault(parseArray(query.branches), []),
		/* Run section */
		startDate,
		finishDate,
		runData: withDefault(parseArray(query.tags), []),
		tagExpr: withDefault(query.tagExpr, ''),
		runIds: withDefault(parseArray(query.runIds), []),
		branchExpr: withDefault(query.branchExpr, ''),
		verdictExpr: withDefault(query.verdictExpr, ''),
		revisionExpr: withDefault(query.revExpr, ''),
		labelExpr: withDefault(query.labelExpr, ''),
		/* Result section */
		runProperties: withDefault(parseArray(query.runProperties), []),
		resultProperties: withDefault(parseArray(query.resultTypes), []),
		results: withDefault(parseArray(query.resultStatuses), []),
		/* Verdict section */
		verdictLookup: withDefault(query.verdictLookup, VERDICT_TYPE.String),
		verdict: withDefault(parseArray(query.verdict), []),
		/* Classification section */
		categories: withDefault(parseArray(query.categories), []),
		untriaged: query.untriaged === 'true',
		explained: query.explained === 'true',
		issue: query.issue ? Number(query.issue) : null
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
		labels: arrayToBadgeItem(state.labels),
		/* Run section */
		runData: arrayToBadgeItem(state.runData),
		runIds: state.runIds?.join(config.queryDelimiter) ?? '',
		tagExpr: state.tagExpr,
		dates: { startDate: state.startDate, endDate: state.finishDate },
		/* Result section */
		resultProperties: state.resultProperties,
		runProperties: state.runProperties,
		results: state.results,
		/* Verdict section */
		verdictLookup: state.verdictLookup,
		verdict: arrayToBadgeItem(state.verdict),
		/* Classification section */
		categories: state.categories,
		untriaged: state.untriaged,
		explained: state.explained,
		issue: state.issue
	};
};

export function searchQueryToBackendQuery(
	query: HistoryAPIQuery
): HistoryAPIBackendQuery {
	const parsedFinishDate = query.finishDate
		? parse(query.finishDate, API_DATE_FORMAT, new Date())
		: new Date();
	const defaultDates = getDefaultHistoryDateRange(
		isValid(parsedFinishDate) ? parsedFinishDate : new Date()
	);

	return {
		testName: query.testName,
		hash: query.hash,
		testArgs: query.parameters,
		revisions: query.revisions,
		branches: query.branches,
		labels: query.labels,
		/* Run section */
		tags: query.runData,
		tagExpr: query.tagExpr,
		branchExpr: query.branchExpr,
		labelExpr: query.labelExpr,
		testArgExpr: query.testArgExpr,
		revExpr: query.revisionExpr,
		verdictExpr: query.verdictExpr,
		fromDate: query.startDate || formatTimeToAPI(defaultDates.startDate),
		toDate: query.finishDate || formatTimeToAPI(defaultDates.finishDate),
		runIds: query.runIds,
		/* Result section */
		resultTypes: query.resultProperties,
		runProperties: query.runProperties,
		resultStatuses: query.results,
		/* Verdict section */
		verdictLookup: query.verdictLookup,
		verdict: query.verdict,
		search: query.search?.trim() || undefined,
		/* Classification section */
		categories: query.categories,
		issue: query.issue,
		untriaged: query.untriaged,
		explained: query.explained,
		page: query.page,
		pageSize: query.pageSize,
		projects: query.project ? [Number(query.project)] : undefined
	};
}

export const historySearchStateToQuery = (
	state: HistorySearchFormState
): HistoryAPIQuery => {
	return {
		/* Test section */
		testName: state.testName,
		hash: state.hash,
		labels: withDefault(arrayToString(state.labels), ''),
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
		runIds: withDefault(arrayToString(state.runIds), ''),
		/* Result section */
		resultProperties: withDefault(arrayToString(state.resultProperties), ''),
		runProperties: withDefault(arrayToString(state.runProperties), ''),
		results: withDefault(arrayToString(state.results), ''),
		/* Verdict section */
		verdictLookup: state.verdictLookup,
		verdict: withDefault(arrayToString(state.verdict), ''),
		/* Classification section */
		categories: withDefault(arrayToString(state.categories), ''),
		untriaged: state.untriaged ? 'true' : '',
		explained: state.explained ? 'true' : '',
		issue: state.issue !== null ? String(state.issue) : ''
	};
};

export const formToSearchState = (
	form: HistoryGlobalSearchFormValues
): Omit<HistorySearchFormState, 'page' | 'pageSize'> => {
	const defaultDates = getDefaultHistoryDateRange();
	const dates = form.dates ?? {
		startDate: defaultDates.startDate,
		endDate: defaultDates.finishDate
	};

	return {
		labels: badgeItemToArray(form.labels),
		labelExpr: form.labelExpr,
		/* Test section */
		testName: form.testName,
		hash: form.hash,
		parameters: badgeItemToArray(form.parameters),
		revisions: badgeItemToArray(form.revisions),
		branches: badgeItemToArray(form.branches),
		/* Run section */
		startDate: dates.startDate,
		finishDate: dates.endDate,
		runData: badgeItemToArray(form.runData),
		runIds: form.runIds.split(config.queryDelimiter),
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
		verdict: badgeItemToArray(form.verdict),
		/* Classification section */
		categories: form.categories ?? [],
		untriaged: form.untriaged ?? false,
		explained: form.explained ?? false,
		issue: form.issue ?? null
	};
};
