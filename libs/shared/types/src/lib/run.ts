/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { z } from 'zod';

import { NodeEntity } from './tree';
import { Pagination } from './utils';

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
	parentId: number | number[];
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

export type RunStats = {
	passed: number;
	failed: number;
	passed_unexpected: number;
	failed_unexpected: number;
	skipped: number;
	skipped_unexpected: number;
	abnormal: number;
};

export type RunData = {
	/** Should be matched between run nodes */
	result_id: number;
	/** Should be matched between run nodes */
	exec_seqno: number;
	iteration_id: number;
	parent_id: number | null;
	type: NodeEntity;
	name: string;
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
	children: MergedRun[];
};

export type RunDataComment = {
	comment_id: string;
	updated: string;
	comment: string;
};

export type RunDataResults = {
	name: string;
	result_id: number;
	iteration_id: number;
	run_id: string;
	has_measurements: boolean;
	has_error: boolean;
	expected_results: RunResultWithKeys[];
	obtained_result: RunResult;
	comments: string[];
	parameters: string[];
	start: string;
	artifacts?: string[];
	requirements?: string[];
};

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

export type ResultLogAPIResponse = {
	url: string;
};

export type RunAPIResponse = {
	results: RunData | null;
};

export type ResultDetailsAPIResponse = {
	pagination: Pagination;
	results: RunDataResults[];
};

export type RunSourceAPIRResponse = {
	url: string | null;
};

/**
 |--------------------------------------------------
 | Full details
 |--------------------------------------------------
 */

export type DetailsItem = {
	name?: string;
	value: string;
	url?: string;
};

export type CompromisedStatusDetails = {
	status: boolean;
	comment?: string;
	bug_id?: string;
	bug_url?: string;
};

export type RunDetailsAPIResponse = {
	project_id: number;
	project_name: string;
	id: number;
	main_package: string;
	start: string;
	finish: string;
	duration: string;
	is_compromised: boolean;
	important_tags: string[];
	compromised: CompromisedStatusDetails;
	relevant_tags: string[];
	branches: string[];
	labels: string[];
	revisions: DetailsItem[];
	special_categories: Record<string, string[]>;
	status: string;
	status_by_nok: string;
	conclusion: RUN_STATUS;
	conclusion_reason?: string | null;
};
