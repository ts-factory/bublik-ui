/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { RESULT_TYPE, RunResult, VERDICT_TYPE } from './run';
import { Pagination } from './utils';

/**
|--------------------------------------------------
| QUERY TYPES
|--------------------------------------------------
*/

/** History page mode */
export type HistoryMode = 'linear' | 'aggregation' | 'measurements';

export type HistoryAPIBackendQuery = {
	testName?: string;
	hash?: string;
	testArgs?: string;
	revisions?: string;
	branches?: string;
	labels?: string;

	fromDate?: string;
	toDate?: string;
	tags?: string;
	tagExpr?: string;

	labelExpr?: string;
	revExpr?: string;
	branchExpr?: string;
	verdictExpr?: string;
	testArgExpr?: string;

	runProperties?: string;
	resultTypes?: string;
	resultStatuses?: string;

	verdictLookup?: VERDICT_TYPE;
	verdict?: string;

	page?: string;
	pageSize?: string;
};

export type HistoryAPIQuery = {
	page?: string;
	pageSize?: string;

	testName?: string;
	hash?: string;
	parameters?: string;
	revisions?: string;
	branches?: string;
	labels?: string;

	startDate?: string;
	finishDate?: string;
	runData?: string;
	tagExpr?: string;

	labelExpr?: string;
	revisionExpr?: string;
	branchExpr?: string;
	verdictExpr?: string;
	testArgExpr?: string;

	runProperties?: string;
	resultProperties?: string;
	results?: string;

	verdictLookup?: VERDICT_TYPE;
	verdict?: string;
};

export type HistorySearchParams = HistoryAPIQuery & {
	mode?: HistoryMode;
	fromRun?: boolean;
};

/**
|--------------------------------------------------
| DATA TYPES
|--------------------------------------------------
*/

export type HistoryDataLinear = {
	start_date: string;
	finish_date: string;
	duration: string;
	obtained_result: RunResult;
	expected_result: RunResult;
	relevant_tags: string[];
	metadata: string[];
	parameters: string[];
	has_error: boolean;
	has_measurements: boolean;
	run_id: string;
	result_id: string;
	iteration_id: string;
	test_name: string;
	results: string[];
	result_properties: string[];
	important_tags: string[];
	run_properties: string[];
};

export type HistoryCount = {
	runs: number;
	expected_results: number;
	iterations: number;
	total_results: number;
	unexpected_results: number;
};

export type HistoryDataAggregation = {
	hash: string;
	iteration_id: string;
	parameters: string[];
	results_by_verdicts: ResultData[];
};

export type ResultData = {
	key: string;
	has_error: boolean;
	result_type: RESULT_TYPE;
	results_data: ResultDataArrayObj[];
	verdict: string[];
};

export type ResultDataArrayObj = {
	result_id: number;
	run_id: number;
	start_date: string;
	relevant_tags: string[];
};

/**
|--------------------------------------------------
| API TYPES
|--------------------------------------------------
*/

export interface HistoryResponse<T> {
	results: T[];
	start_date: string;
	finish_date: string;
	counts: HistoryCount;
	pagination: Pagination;
	results_ids: number[];
}

export type HistoryLinearAPIResponse = HistoryResponse<HistoryDataLinear>;

export type HistoryDataAggregationAPIResponse =
	HistoryResponse<HistoryDataAggregation>;
