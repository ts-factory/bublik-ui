/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { z } from 'zod';

import { RESULT_TYPE, ResultTypeSchema, RunResult, VERDICT_TYPE } from './run';
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
	runIds?: string;
	resultTypes?: string;
	resultStatuses?: string;

	verdictLookup?: VERDICT_TYPE;
	verdict?: string;

	page?: string;
	pageSize?: string;
	projects?: number[];
};

export const HistoryAPIBackendQuerySchema = z.object({
	testName: z.string().optional(),
	hash: z.string().optional(),
	testArgs: z.string().optional(),
	revisions: z.string().optional(),
	branches: z.string().optional(),
	labels: z.string().optional(),

	fromDate: z.string().optional(),
	toDate: z.string().optional(),
	tags: z.string().optional(),
	tagExpr: z.string().optional(),

	labelExpr: z.string().optional(),
	revExpr: z.string().optional(),
	branchExpr: z.string().optional(),
	verdictExpr: z.string().optional(),
	testArgExpr: z.string().optional(),

	runProperties: z.string().optional(),
	runIds: z.string().optional(),
	resultTypes: z.string().optional(),
	resultStatuses: z.string().optional(),

	verdictLookup: z.nativeEnum(VERDICT_TYPE).optional(),
	verdict: z.string().optional(),

	page: z.string().optional(),
	pageSize: z.string().optional(),
	projects: z.array(z.number()).optional()
});

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
	runIds?: string;

	verdictLookup?: VERDICT_TYPE;
	verdict?: string;
	project?: string;
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
	expected_results: RunResult[];
	relevant_tags: string[];
	metadata: string[];
	parameters: string[];
	has_error: boolean;
	has_measurements: boolean;
	run_id: number;
	result_id: number;
	iteration_id: number;
	results?: string[];
	result_properties?: string[];
	important_tags: string[];
	run_properties?: string[];
	report_config_id?: number | null;
};

const RunResultSchema = z.object({
	result_type: ResultTypeSchema,
	verdicts: z.array(z.string())
});

export const HistoryDataLinearSchema = z.object({
	start_date: z.string(),
	finish_date: z.string(),
	duration: z.string(),
	obtained_result: RunResultSchema,
	expected_results: z.array(RunResultSchema),
	relevant_tags: z.array(z.string()),
	metadata: z.array(z.string()),
	parameters: z.array(z.string()),
	has_error: z.boolean(),
	has_measurements: z.boolean(),
	run_id: z.number(),
	result_id: z.number(),
	iteration_id: z.number(),
	results: z.array(z.string()).optional(),
	result_properties: z.array(z.string()).optional(),
	important_tags: z.array(z.string()),
	run_properties: z.array(z.string()).optional(),
	report_config_id: z.number().nullable().optional()
});

export type HistoryCount = {
	runs: number;
	expected_results: number;
	iterations: number;
	total_results: number;
	unexpected_results: number;
};

const HistoryCountSchema = z.object({
	runs: z.number(),
	expected_results: z.number(),
	iterations: z.number(),
	total_results: z.number(),
	unexpected_results: z.number()
});

const HistoryPaginationSchema = z.object({
	previous: z.string().nullable(),
	next: z.string().nullable(),
	count: z.number()
});

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
	important_tags: string[];
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

export const HistoryLinearAPIResponseSchema = z.object({
	from_date: z.string(),
	to_date: z.string(),
	counts: HistoryCountSchema,
	pagination: HistoryPaginationSchema,
	results: z.array(HistoryDataLinearSchema),
	results_ids: z.array(z.number())
});

export type HistoryLinearAPIResponse = z.infer<
	typeof HistoryLinearAPIResponseSchema
>;

export type HistoryDataAggregationAPIResponse =
	HistoryResponse<HistoryDataAggregation>;
