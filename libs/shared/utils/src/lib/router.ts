/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { addDays, addMonths, isBefore, isValid, parseISO } from 'date-fns';

import {
	DetailsAPIResponse,
	HistoryAPIQuery,
	HistoryDefaultResultAPIResponse,
	HistoryMode,
	HistorySearchParams,
	RESULT_PROPERTIES,
	RUN_PROPERTIES,
	RunDataResults
} from '@/shared/types';
import {
	DEFAULT_HISTORY_END_DATE,
	DEFAULT_RESULT_TYPES,
	DEFAULT_RUN_PROPERTIES,
	DEFAULT_VERDICT_LOOKUP
} from '@/bublik/config';
import { stringifySearch } from '@/router';

import { formatTimeToAPI } from './time';

/**
 * If passed date is older than 3 months we extend to 6 months
 * else we default to 3 months range
 */
const getFromDate = (maybeDate: string) => {
	const today = new Date();
	const parsedDate = isValid(parseISO(maybeDate)) ? parseISO(maybeDate) : today;
	const isOlderThanThreeMonths = isBefore(parsedDate, addMonths(today, -3));
	const offsetFromSixMonths = addMonths(parsedDate, -6);
	const passedOffset = addMonths(parsedDate, -3);

	if (isOlderThanThreeMonths) {
		return formatTimeToAPI(addDays(offsetFromSixMonths, -3));
	} else {
		return formatTimeToAPI(addDays(passedOffset, -3));
	}
};

const getToDate = (maybeDate: string) => {
	const parsedDate = isValid(parseISO(maybeDate))
		? parseISO(maybeDate)
		: new Date();

	return formatTimeToAPI(parsedDate);
};

export const buildQuery = (config: {
	result: HistoryDefaultResultAPIResponse;
	runDetails: DetailsAPIResponse;
}): HistorySearchParams => {
	const {
		result: { result },
		runDetails
	} = config;

	const testName = result.name;
	const startDate = getFromDate(runDetails.start);
	const finishDate = formatTimeToAPI(DEFAULT_HISTORY_END_DATE);
	const runProperties = RUN_PROPERTIES.NotCompromised;
	const resultProperties = result.has_error
		? RESULT_PROPERTIES.Unexpected
		: RESULT_PROPERTIES.Expected;
	const results = result.obtained_result.result_type;
	const parameters = result.parameters.join(';');
	const verdictLookup = DEFAULT_VERDICT_LOOKUP;

	return {
		testName,
		startDate,
		finishDate,
		runProperties,
		resultProperties,
		results,
		parameters,
		verdictLookup,
		mode: 'linear',
		page: '1',
		pageSize: '25'
	};
};

export interface HistorySearch {
	prefilled: string;
	byTestName: string;
	byIteration: string;
	byIterationWithImportant: string;
	byIterationWithAllTags: string;
}

const shared: Partial<HistorySearchParams> = {
	mode: 'linear',
	page: '1',
	results: DEFAULT_RESULT_TYPES.join(';'),
	verdictLookup: DEFAULT_VERDICT_LOOKUP
};

const byPrefilled = (
	result: RunDataResults,
	allTags: string[],
	maybeToDate: string
): HistoryAPIQuery => {
	return {
		...shared,
		startDate: getFromDate(maybeToDate),
		finishDate: getToDate(maybeToDate),
		testName: result.name,
		parameters: result.parameters.join(';'),
		runProperties: DEFAULT_RUN_PROPERTIES.join(';'),
		resultProperties: result.has_error
			? RESULT_PROPERTIES.Unexpected
			: RESULT_PROPERTIES.Expected,
		verdict: result.obtained_result.verdict.join(';'),
		runData: allTags.join(';')
	};
};

const byTestName = (
	result: RunDataResults,
	maybeToDate: string
): HistoryAPIQuery => ({
	...shared,
	startDate: getFromDate(maybeToDate),
	finishDate: getToDate(maybeToDate),
	testName: result.name,
	runProperties: RUN_PROPERTIES.NotCompromised
});

const byIteration = (
	result: RunDataResults,
	maybeToDate: string
): HistoryAPIQuery => ({
	...shared,
	startDate: getFromDate(maybeToDate),
	finishDate: getToDate(maybeToDate),
	testName: result.name,
	runProperties: RUN_PROPERTIES.NotCompromised,
	parameters: result.parameters.join(';')
});

const byIterationWithImportant = (
	result: RunDataResults,
	importantTags: string[],
	maybeToDate: string
): HistoryAPIQuery => ({
	...shared,
	startDate: getFromDate(maybeToDate),
	finishDate: getToDate(maybeToDate),
	testName: result.name,
	parameters: result.parameters.join(';'),
	runProperties: RUN_PROPERTIES.NotCompromised,
	runData: importantTags.join(';')
});

const byIterationWithAllTags = (
	result: RunDataResults,
	allTags: string[],
	maybeToDate: string
): HistoryAPIQuery => ({
	...shared,
	startDate: getFromDate(maybeToDate),
	finishDate: getToDate(maybeToDate),
	testName: result.name,
	parameters: result.parameters?.join(';'),
	runProperties: RUN_PROPERTIES.NotCompromised,
	runData: allTags.join(';')
});

export const getHistorySearch = (
	runDetails: DetailsAPIResponse,
	resultInfo: RunDataResults,
	userPreferredHistoryMode: HistoryMode
): HistorySearch => {
	const { relevant_tags, important_tags } = runDetails;
	const important = important_tags;
	const allRunTags = [...important, ...relevant_tags];

	const prefilled = byPrefilled(resultInfo, allRunTags, runDetails.finish);
	const testName = byTestName(resultInfo, runDetails.finish);
	const iteration = byIteration(resultInfo, runDetails.finish);

	const iterationWithImportant = byIterationWithImportant(
		resultInfo,
		important,
		runDetails.finish
	);

	const iterationWithAllTags = byIterationWithAllTags(
		resultInfo,
		allRunTags,
		runDetails.finish
	);

	const searchObj = {
		prefilled: stringifySearch(prefilled).concat('&fromRun=true'),
		byTestName: stringifySearch(testName),
		byIteration: stringifySearch(iteration),
		byIterationWithImportant: stringifySearch(iterationWithImportant),
		byIterationWithAllTags: stringifySearch(iterationWithAllTags)
	};

	return Object.fromEntries(
		Object.entries(searchObj).map(([key, search]) => {
			const searchParams = new URLSearchParams(search);
			searchParams.set('mode', userPreferredHistoryMode);

			return [key, searchParams.toString()];
		})
	) as unknown as HistorySearch;
};
