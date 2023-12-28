/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { nanoid } from '@reduxjs/toolkit';
import { format, parse } from 'date-fns';
import { decamelizeKeys } from 'humps';

import { API_DATE_FORMAT } from '@/bublik/config';
import { BadgeItem } from '@/shared/tailwind-ui';
import { HistoryAPIQuery } from '@/shared/types';

import { HISTORY_CONSTANTS } from './global-search-form.constants';
import { HistoryGlobalSearchFormValues } from './global-search-form.types';

export const join = (arr: string[]) => arr.join(';');
export const split = (str: string | undefined, fallback: string[] = []) => {
	if (!str) return fallback;

	return str.split(';');
};

const badgesToValues = (badges: BadgeItem[]) => {
	const expressions = badges.map((badge) => badge.value);
	const values = badges.map((badge) => badge.value);

	return [values, expressions] as const;
};

export const valuesToBadges = (
	arr: string | undefined,
	fallback: BadgeItem[] = []
): BadgeItem[] => {
	if (!arr) return fallback;

	return arr.split(';').map((value) => ({ id: nanoid(4), value }));
};

export const convertHistoryFormToQuery = (
	values: HistoryGlobalSearchFormValues
): HistoryAPIQuery => {
	const {
		testName,
		hash,
		parameters,
		runData,
		dates,
		runProperties,
		resultProperties,
		results,
		verdictLookup,
		verdict,
		branches,
		revisions
	} = values;

	const [simpleParams, expressionsParams] = badgesToValues(parameters);
	const [simpleRunData, expressionsRunData] = badgesToValues(runData);
	const [simpleBranches, expressionsBranches] = badgesToValues(branches);
	const [simpleRevisions, expressionsRevisions] = badgesToValues(revisions);
	const [simpleVerdicts, expressionsVerdicts] = badgesToValues(verdict);

	const allExpressions = expressionsParams
		.concat(expressionsRunData)
		.concat(expressionsBranches)
		.concat(expressionsRevisions)
		.concat(expressionsVerdicts)
		.join('&');

	const startDate = dates.startDate
		? format(dates.startDate, API_DATE_FORMAT)
		: '';
	const finishDate = dates.endDate
		? format(dates.endDate, API_DATE_FORMAT)
		: '';

	return decamelizeKeys(
		{
			testName,
			hash,
			startDate,
			finishDate,
			parameters: join(simpleParams),
			runData: join(simpleRunData),
			runDataExpr: allExpressions,
			branches: join(simpleBranches),
			revisions: join(simpleRevisions),
			runProperties: join(runProperties),
			resultProperties: join(resultProperties),
			results: join(results),
			verdict: join(simpleVerdicts),
			verdictLookup
		},
		{ separator: '_' }
	) as HistoryAPIQuery;
};

export const getInitialGlobalSearch = (
	historyQuery: HistoryAPIQuery
): HistoryGlobalSearchFormValues => {
	const {
		testName: queryTestName,
		hash: queryHash,
		parameters: queryParameters,
		runData: queryRunData,
		startDate: queryStartDate,
		finishDate: queryFinishDate,
		runProperties: queryRunProperties,
		resultProperties: queryResultProperties,
		results: queryResults,
		verdictLookup: queryVerdictLookup,
		verdict: queryVerdict,
		branches: queryBranches,
		revisions: queryRevisons,
		tagExpr: queryRunDataExpr
	} = historyQuery;

	const runData: BadgeItem[] = split(queryRunData).map((value) => ({
		id: nanoid(4),
		value
	}));

	const startDate = queryStartDate
		? parse(queryStartDate, API_DATE_FORMAT, new Date())
		: HISTORY_CONSTANTS.startDate;

	const endDate = queryFinishDate
		? parse(queryFinishDate, API_DATE_FORMAT, new Date())
		: new Date();

	return {
		testName: queryTestName ?? '',
		hash: queryHash ?? '',
		parameters: valuesToBadges(queryParameters, []),
		revisions: valuesToBadges(queryRevisons, []),
		branches: valuesToBadges(queryBranches, []),
		runData,
		dates: { startDate, endDate },
		tagExpr: queryRunDataExpr ?? '',
		runProperties: split(queryRunProperties, HISTORY_CONSTANTS.runProperties),
		resultProperties: split(
			queryResultProperties,
			HISTORY_CONSTANTS.resultProperties
		),
		results: split(queryResults, HISTORY_CONSTANTS.results),
		verdictLookup: queryVerdictLookup || HISTORY_CONSTANTS.verdict,
		verdict: valuesToBadges(queryVerdict, [])
	};
};
