/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { RUN_STATUS } from './run';
import { Pagination } from './utils';

/**
|--------------------------------------------------
| QUERY
|--------------------------------------------------
*/

export type RunsAPIQuery = {
	page?: string | null;
	startDate?: string | null;
	finishDate?: string | null;
	runData?: string | null;
	tagExpr?: string | null;
	pageSize?: string | null;
	project?: number;
};

/**
|--------------------------------------------------
| DATA TYPES
|--------------------------------------------------
*/

export interface RunsStatisticData {
	tests_total: number;
	tests_total_nok: number;
	tests_total_nok_percent: number;
	tests_total_ok: number;
	tests_total_ok_percent: number;
	tests_total_plan_percent: number;
}

export type RunsData = {
	id: number;
	start: string;
	finish: string;
	relevant_tags: string[];
	important_tags: string[];
	metadata: string[];
	stats: RunsStatisticData;
	status: string;
	status_by_nok: string;
	conclusion: RUN_STATUS;
	conclusion_reason?: string | null;
};

export type RunsAPIResponse = {
	pagination: Pagination;
	results: RunsData[];
};
