/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { z } from 'zod';

export enum Severity {
	INFO = 'info',
	WARNING = 'warning',
	ERROR = 'err',
	DEBUG = 'debug'
}

export enum Facility {
	ImportRuns = 'importruns',
	MetaCaterigozation = 'meta_categorization',
	AddTags = 'add_tags',
	Celery = 'celery'
}

export const ImportTaskEventLogSchema = z.object({
	timestamp: z.string(),
	facility: z.string(),
	severity: z.string(),
	msg: z.string()
});

export type ImportTaskEventLog = z.infer<typeof ImportTaskEventLogSchema>;

export const ImportTaskRowRawSchema = z.object({
	status: z.enum(['RECEIVED', 'RUNNING', 'SUCCESS', 'FAILURE']).or(z.string()),
	run_source_url: z.string(),
	celery_task: z.string().optional().nullable(),
	started_at: z.string().nullable(),
	finished_at: z.string().nullable(),
	runtime: z.string().nullable(),
	job_id: z.number(),
	run_id: z.number().nullable(),
	event_logs: z.array(ImportTaskEventLogSchema),
	error_msg: z.string().nullable()
});

export type ImportTaskRowRaw = z.infer<typeof ImportTaskRowRawSchema>;

export const ImportTaskRowSchema = ImportTaskRowRawSchema.extend({
	runtime: z.number().nullable()
});

export type ImportTaskRow = z.infer<typeof ImportTaskRowSchema>;

export const ImportTaskListRawResponseSchema = z.object({
	pagination: z.object({ count: z.number() }),
	results: z.array(ImportTaskRowRawSchema)
});

export const ImportTaskListResponseSchema = z.object({
	pagination: z.object({ count: z.number() }),
	results: z.array(ImportTaskRowSchema)
});

export type ImportTaskListResponse = z.infer<
	typeof ImportTaskListResponseSchema
>;

export const ImportJobTaskDataSchema = z.object({
	run_source_url: z.string(),
	celery_task_id: z.string().nullable(),
	flower: z.string().nullable(),
	import_log: z.string().nullable()
});

export type ImportJobTaskData = z.infer<typeof ImportJobTaskDataSchema>;

export const ImportRunsJobResponseSchema = z.object({
	job_id: z.number(),
	job_tasks_data: z.array(ImportJobTaskDataSchema)
});

export type ImportRunsJobResponse = z.infer<typeof ImportRunsJobResponseSchema>;

const optionalNumberFilterSchema = z.preprocess((val) => {
	if (val === '' || val == null) return undefined;

	if (typeof val === 'number') {
		return Number.isNaN(val) ? undefined : val;
	}

	const parsed = Number(val);
	return Number.isNaN(parsed) ? undefined : parsed;
}, z.number().optional());

export const ImportTaskFiltersSchema = z.object({
	job: optionalNumberFilterSchema,
	run: optionalNumberFilterSchema,
	url: z.preprocess((arg) => (arg ? arg : undefined), z.string().optional()),
	celery_task: z.preprocess(
		(arg) => (arg ? arg : undefined),
		z.string().optional()
	),
	status: z.preprocess(
		(arg) => (arg ? arg : undefined),
		z
			.enum(['RECEIVED', 'RUNNING', 'SUCCESS', 'FAILURE'])
			.or(z.string())
			.optional()
	),
	page: z.number().optional(),
	page_size: z.number().optional()
});

export type ImportTaskFilters = z.infer<typeof ImportTaskFiltersSchema>;

export const ImportJsonLogResponseSchema = z.object({
	asctime: z.string(),
	levelname: z.string(),
	message: z.string(),
	module: z.string()
});

export type ImportJsonLog = z.infer<typeof ImportJsonLogResponseSchema>;
