/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	HistoryDataLinear,
	RESULT_PROPERTIES,
	VERDICT_TYPE
} from '@/shared/types';
import { DEFAULT_RESULT_TYPES } from '@/bublik/config';
import { historySearch, type HistoryRouteSearch } from '@/shared/utils';

type Query = Record<string, string | undefined>;

/** A key of the current search in its wire spelling (`;`-joined lists). */
function wireOf(
	search: HistoryRouteSearch,
	key:
		| 'branches'
		| 'parameters'
		| 'resultProperties'
		| 'results'
		| 'runProperties'
): string | undefined {
	const value = historySearch.shape[key].serialize(search[key]);

	return Array.isArray(value) ? value.join(';') : value;
}

/** `?key=value&…` in insertion order, absent values skipped. */
function toSearchString(query: Query): string {
	const params = new URLSearchParams();

	for (const [key, value] of Object.entries(query)) {
		if (value !== undefined) params.append(key, value);
	}

	const searchStr = params.toString();

	return searchStr ? `?${searchStr}` : '';
}

/**
 * The three history links of a linear row: the row's own query and the
 * all/similar unexpected shortcuts, each on top of the current search's test
 * path, dates, page size and mode, on page 1. Search strings for
 * `{ pathname: '/history', search }`.
 */
function getHistoryShortcuts(
	row: HistoryDataLinear,
	search: HistoryRouteSearch
) {
	const base: Query = {
		testName: search.testName,
		mode: search.mode,
		page: '1',
		pageSize: search.pageSize,
		hash: search.hash,
		startDate: search.startDate,
		finishDate: search.finishDate,
		verdictLookup: VERDICT_TYPE.String,
		branches: wireOf(search, 'branches'),
		parameters: wireOf(search, 'parameters'),
		resultProperties: wireOf(search, 'resultProperties'),
		results: wireOf(search, 'results')
	};

	// 1. All unexpected
	// - All outcomes with unexpected
	// - With meta, tags, parameters
	const allUnexpected: Query = {
		...base,
		resultProperties: RESULT_PROPERTIES.Unexpected,
		runData: [
			...row.relevant_tags,
			...row.important_tags,
			...row.metadata
		].join(';'),
		parameters: row.parameters.join(';'),
		results: DEFAULT_RESULT_TYPES.join(';')
	};

	// 2. Similar unexpected
	// - All outcomes with unexpected
	// - With meta, tags, parameters
	// - With verdicts
	const similarUnexpected: Query = {
		...base,
		resultProperties: RESULT_PROPERTIES.Unexpected,
		runData: [
			...row.relevant_tags,
			...row.important_tags,
			...row.metadata
		].join(';'),
		parameters: row.parameters.join(';'),
		verdict: row.obtained_result.verdicts.join(';'),
		results: DEFAULT_RESULT_TYPES.join(';')
	};

	// 3. History query
	const historyQuery: Query = {
		...base,
		runData: [
			...row.important_tags,
			...row.relevant_tags,
			...row.metadata
		].join(';'),
		parameters: row.parameters.join(';'),
		results: row.obtained_result.result_type,
		verdict: row.obtained_result.verdicts.join(';'),
		runProperties: wireOf(search, 'runProperties'),
		resultProperties: row.has_error
			? RESULT_PROPERTIES.Unexpected
			: RESULT_PROPERTIES.Expected
	};

	return {
		allUnexpected: toSearchString(allUnexpected),
		similarUnexpected: toSearchString(similarUnexpected),
		historyQuery: toSearchString(historyQuery)
	};
}

export { getHistoryShortcuts };
