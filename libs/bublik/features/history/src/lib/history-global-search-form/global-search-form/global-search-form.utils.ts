/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { nanoid } from '@reduxjs/toolkit';
import { parse } from 'date-fns';

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

export const valuesToBadges = (
	arr: string | undefined,
	fallback: BadgeItem[] = []
): BadgeItem[] => {
	if (!arr) return fallback;

	return arr.split(';').map((value) => ({ id: nanoid(4), value }));
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
		runIds: queryRunIds,
		runProperties: queryRunProperties,
		resultProperties: queryResultProperties,
		results: queryResults,
		verdictLookup: queryVerdictLookup,
		verdict: queryVerdict,
		branches: queryBranches,
		revisions: queryRevisons,
		tagExpr: queryRunDataExpr,
		labels: queryLabels,
		branchExpr = '',
		labelExpr = '',
		revisionExpr = '',
		testArgExpr = '',
		verdictExpr = ''
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
		labels: valuesToBadges(queryLabels, []),
		branchExpr,
		labelExpr,
		revisionExpr,
		testArgExpr,
		verdictExpr,
		runData,
		runIds: queryRunIds ?? '',
		dates: { startDate, endDate },
		tagExpr: queryRunDataExpr ?? '',
		runProperties: split(queryRunProperties, HISTORY_CONSTANTS.runProperties),
		resultProperties: split(
			queryResultProperties,
			HISTORY_CONSTANTS.resultProperties
		),
		results: split(queryResults, HISTORY_CONSTANTS.results),
		verdictLookup: queryVerdictLookup || HISTORY_CONSTANTS.verdict,
		verdict: valuesToBadges(queryVerdict, []),
		categories: split(historyQuery.categories, []),
		untriaged: historyQuery.untriaged === 'true'
	};
};
