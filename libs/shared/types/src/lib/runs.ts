/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { z } from 'zod';

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
	projects?: number[];
};

export type RunsChartsGroupBy = 'day' | 'week';

export const RunsChartsAPIQuerySchema = z.object({
	startDate: z.string().nullable().optional(),
	finishDate: z.string().nullable().optional(),
	runData: z.string().nullable().optional(),
	tagExpr: z.string().nullable().optional(),
	projects: z.array(z.number()).optional(),
	groupBy: z.enum(['day', 'week']).optional()
});

export type RunsChartsAPIQuery = z.infer<typeof RunsChartsAPIQuerySchema>;

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

export const RunsChartsBucketSchema = z.object({
	date: z.string(),
	tests: z.object({
		ok: z.number(),
		nok: z.number(),
		total: z.number(),
		passrate: z.number()
	}),
	run_ids_by_status: z.object({
		[RUN_STATUS.Busy]: z.array(z.number()),
		[RUN_STATUS.Compromised]: z.array(z.number()),
		[RUN_STATUS.Error]: z.array(z.number()),
		[RUN_STATUS.Interrupted]: z.array(z.number()),
		[RUN_STATUS.Ok]: z.array(z.number()),
		[RUN_STATUS.Running]: z.array(z.number()),
		[RUN_STATUS.Stopped]: z.array(z.number()),
		[RUN_STATUS.Warning]: z.array(z.number())
	})
});

export const RunsChartsAPIResponseSchema = z.object({
	buckets: z.array(RunsChartsBucketSchema)
});

export type RunsChartsBucket = z.infer<typeof RunsChartsBucketSchema>;
export type RunsChartsAPIResponse = z.infer<
	typeof RunsChartsAPIResponseSchema
>;
