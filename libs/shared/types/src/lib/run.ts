/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { z } from 'zod';

import { NodeEntity } from './tree';

/** Run property state */
export const enum RUN_PROPERTIES {
	Compromised = 'compromised',
	NotCompromised = 'notcompromised'
}

/** Run result state */
export const enum RESULT_PROPERTIES {
	Expected = 'expected',
	Unexpected = 'unexpected',
	NotRun = 'not_run'
}

/** Run result */
export enum RESULT_TYPE {
	Passed = 'PASSED',
	Failed = 'FAILED',
	Killed = 'KILLED',
	Cored = 'CORED',
	Skipped = 'SKIPPED',
	Faked = 'FAKED',
	Incomplete = 'INCOMPLETE'
}

export const ResultTypeSchema = z.nativeEnum(RESULT_TYPE);

export const RunStatsColumnSchema = z.enum([
	'run',
	'passed',
	'failed',
	'passed_unexpected',
	'failed_unexpected',
	'skipped',
	'skipped_unexpected',
	'abnormal',
	'comments',
	'objective',
	'total',
	'total_expected',
	'total_unexpected'
]);

export type RunStatsColumn = z.infer<typeof RunStatsColumnSchema>;

/** Verdict type */
export enum VERDICT_TYPE {
	String = 'string',
	Regex = 'regex',
	None = 'none'
}

/** Run status for a row is used for determining run status icon */
export enum RUN_STATUS {
	Ok = 'run-ok',
	Error = 'run-error',
	Warning = 'run-warning',
	Running = 'run-running',
	Compromised = 'run-compromised',
	Busy = 'run-busy',
	Stopped = 'run-stopped',
	Interrupted = 'run-interrupted'
}

export type RunResult = {
	result_type: RESULT_TYPE;
	verdicts: string[];
};

export type RunResultWithKeys = RunResult & {
	keys: {
		name: string;
		url?: string;
	}[];
};

/**
 |--------------------------------------------------
 | QUERY
 |--------------------------------------------------
 */

export type RunPageParams = {
	runId: string;
};

export type ResultTableAPIQuery = {
	selectors: {
		parentId: number;
		startExecSeqno: number;
	}[];
	testName: string;
};

export type ResultTableFilter = {
	results: RESULT_TYPE[];
	resultProperties: RESULT_PROPERTIES[];
};

export type ResultTableAPIQueryWithFilter = ResultTableAPIQuery & {
	requests: Record<string, ResultTableFilter>;
};

/**
 |--------------------------------------------------
 | DATA TYPES
 |--------------------------------------------------
 */

export const RunStatsSchema = z.object({
	passed: z.number(),
	failed: z.number(),
	passed_unexpected: z.number(),
	failed_unexpected: z.number(),
	skipped: z.number(),
	skipped_unexpected: z.number(),
	abnormal: z.number()
});

export type RunStats = z.infer<typeof RunStatsSchema>;

export type RunData = {
	/** Test iteration result ID */
	result_id: number;
	/** Should be matched between run nodes */
	test_id: number;
	/** Should be matched between run nodes */
	exec_seqno: number;
	parent_id: number | null;
	type: NodeEntity;
	test_name: string;
	period: string;
	path: string[];
	stats: RunStats;
	children: RunData[];
	objective?: string;
	comments?: Array<RunDataComment>;
};

export type MergedRun = Omit<
	RunData,
	'parent_id' | 'result_id' | 'children'
> & {
	parent_ids: number[];
	result_ids: number[];
	result_selectors: ResultTableAPIQuery['selectors'];
	children: MergedRun[];
};

export const RunDataCommentSchema = z.object({
	comment_id: z.string(),
	updated: z.string(),
	comment: z.string()
});

export type RunDataComment = z.infer<typeof RunDataCommentSchema>;

const NodeEntitySchema = z.custom<NodeEntity>((value) =>
	['pkg', 'session', 'test', 'suite'].includes(String(value))
);

export const RunDataSchema = z.object({
	result_id: z.number(),
	test_id: z.number(),
	exec_seqno: z.number(),
	parent_id: z.number().nullable(),
	type: NodeEntitySchema,
	test_name: z.string(),
	period: z.string(),
	path: z.array(z.string()),
	stats: RunStatsSchema,
	children: z.array(z.unknown()).transform((children) => children as RunData[]),
	objective: z.string().optional(),
	comments: z.array(RunDataCommentSchema).optional()
});

const RunResultSchema = z.object({
	result_type: ResultTypeSchema,
	verdicts: z.array(z.string())
});

const RunResultWithKeysSchema = RunResultSchema.and(
	z.object({
		keys: z.array(
			z.object({ name: z.string(), url: z.string().nullable().optional() })
		)
	})
);

export const RunDataResultsSchema = z.object({
	name: z.string(),
	result_id: z.number(),
	iteration_id: z.number(),
	run_id: z.number(),
	has_measurements: z.boolean(),
	has_error: z.boolean(),
	expected_results: z.array(RunResultWithKeysSchema),
	obtained_result: RunResultSchema,
	comments: z.array(z.string()),
	parameters: z.array(z.string()),
	start: z.string(),
	artifacts: z.array(z.string()).optional(),
	requirements: z.array(z.string()).optional()
});

export type RunDataResults = z.infer<typeof RunDataResultsSchema>;

/**
 |--------------------------------------------------
 | DEFINE AS COMPROMISED
 |--------------------------------------------------
 */

/** Form values to convert later to request */
export interface DefineCompromisedFormValues {
	comment: string;
	bugId: string;
	bugStorageKey: string;
}

/** Request to delete compromised status from run */
export interface CompromisedDeleteResponse {
	/** Message if removed compromised status e.g "Run 9230644 now is not compromised" */
	message: string;
}

/** Request body to mark run as compromised */
export interface CompromisedBody {
	/** Run ID */
	runId: number;
	/** Compromised comment */
	comment: string;
	/** Bug ID */
	bugId: number;
	referenceKey: string;
}

export type CreateTestCommentParams = {
	projectId: number;
	testId: number;
	comment: string;
};

export type EditTestCommentParams = {
	projectId: number;
	testId: number;
	commentId: number;
	comment: string;
};

export type DeleteTestCommentParams = {
	projectId: number;
	testId: number;
	commentId: number;
};

export type CreateTestCommentResponse = {
	id: number;
	updated: string;
	meta: { name?: unknown; type: 'comment'; value: string; comment?: unknown };
	test: number;
	serial: number;
};

/** When run is marked as compromised successfully */
export interface CompromisedPostResponse {
	/** Compromised comment */
	comment: string;
	/** Bug ID string e.g "Bug ID: 123" */
	bug: string;
}

/** Individual info about bugs storage */
export type CompromisedTagValue = {
	name: string;
	uri: string;
};

/** Information about bugs storages */
export type CompromisedTagsResponse = {
	/** Keys are bugs storage id and values are meta about storage */
	issues: Record<string, CompromisedTagValue>;
};

/**
 |--------------------------------------------------
 | API RESPONSES
 |--------------------------------------------------
 */

export const ResultLogAPIResponseSchema = z.object({
	url: z.string()
});

export type ResultLogAPIResponse = z.infer<typeof ResultLogAPIResponseSchema>;

export const RunAPIResponseSchema = z.object({
	results: RunDataSchema.nullable(),
	default_columns: z.array(RunStatsColumnSchema).optional()
});

export type RunAPIResponse = z.infer<typeof RunAPIResponseSchema>;

export const RunTableAPIResponseSchema = z.object({
	results: z.array(RunDataSchema).nullable(),
	defaultColumns: z.array(RunStatsColumnSchema).optional()
});

export type RunTableAPIResponse = z.infer<typeof RunTableAPIResponseSchema>;

export type MergedRunTableAPIResponse = {
	results: MergedRun[];
	defaultColumns?: RunStatsColumn[];
};

export const ResultDetailsAPIResponseSchema = z.object({
	results: z.array(RunDataResultsSchema)
});

export type ResultDetailsAPIResponse = z.infer<
	typeof ResultDetailsAPIResponseSchema
>;

export const RunSourceAPIRResponseSchema = z.object({
	url: z.string().nullable()
});

export type RunSourceAPIRResponse = z.infer<typeof RunSourceAPIRResponseSchema>;

/**
 |--------------------------------------------------
 | Full details
 |--------------------------------------------------
 */

export const DetailsItemSchema = z.object({
	name: z.string().optional(),
	value: z.coerce.string(),
	url: z.string().optional()
});

export type DetailsItem = z.infer<typeof DetailsItemSchema>;

export const CompromisedStatusDetailsSchema = z.object({
	status: z.boolean().default(false),
	comment: z.string().optional(),
	bug_id: z.string().optional(),
	bug_url: z.string().optional()
});

export type CompromisedStatusDetails = z.infer<
	typeof CompromisedStatusDetailsSchema
>;

export const RunDetailsAPIResponseSchema = z.object({
	project_id: z.number(),
	project_name: z.string(),
	id: z.number(),
	main_package: z.string().default(''),
	start: z.string().default(''),
	finish: z.string().default(''),
	duration: z.string().default(''),
	is_compromised: z.boolean().default(false),
	important_tags: z.array(z.string()).default([]),
	compromised: CompromisedStatusDetailsSchema.default({ status: false }),
	relevant_tags: z.array(z.string()).default([]),
	branches: z.array(z.string()).default([]),
	labels: z.array(z.string()).default([]),
	revisions: z.array(DetailsItemSchema).default([]),
	special_categories: z.record(z.string(), z.array(z.string())).default({}),
	configuration: z.string().optional(),
	status: z.string().default(''),
	status_by_nok: z.string().default(''),
	conclusion: z.nativeEnum(RUN_STATUS),
	conclusion_reason: z.string().nullable().optional()
});

export type RunDetailsAPIResponse = z.infer<typeof RunDetailsAPIResponseSchema>;
