/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { RESULT_TYPE, VERDICT_TYPE } from '@/shared/types';

import { HISTORY_SLICE_NAME } from './history-slice';

export type AppStateWithHistorySlice = {
	[HISTORY_SLICE_NAME]: HistorySliceState;
};

export type HistoryGlobalFilter = {
	/** Obtained result verdicts */
	verdicts: string[];
	/** Includes relevant tags and metadata columns */
	tags: string[];
	/** Parameters */
	parameters: string[];
	/** Verdict parameter type e.g PASSED | FAILED */
	resultType: RESULT_TYPE | null;
	/** Is result not expected */
	isNotExpected: boolean | null;
	/** Global substring filter */
	substringFilter: string;
};

export type HistorySliceState = {
	isGlobalSearchFormOpen: boolean;
	globalFilter: HistoryGlobalFilter;
	searchForm: HistorySearchFormState;
};

export type HistorySearchFormState = HistoryStateSearch;

/* All of this goes to URL and describes global search form */
export type HistoryStateSearch = {
	/* Test section */
	testName: string;
	hash: string;
	parameters: string[];
	revisions: string[];
	branches: string[];
	/* Run section */
	startDate: Date;
	finishDate: Date;
	runData: string[];
	tagExpr: string;
	/* Result section */
	runProperties: string[];
	resultProperties: string[];
	results: string[];
	/* Verdict section */
	verdictLookup: VERDICT_TYPE;
	verdict: string[];
	branchExpr: string;
	verdictExpr: string;
	revisionExpr: string;
	testArgExpr: string;
	labelExpr: string;
};
