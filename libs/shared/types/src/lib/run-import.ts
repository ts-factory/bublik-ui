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

export const LogEventSchema = z.object({
	event_id: z.number(),
	status: z.enum(['SUCCESS', 'FAILURE']).or(z.string()),
	uri: z.string(),
	celery_task: z.string().optional(),
	facility: z.nativeEnum(Facility),
	severity: z.nativeEnum(Severity),
	timestamp: z.string(),
	error_msg: z.string().optional()
});

export const LogQuerySchema = z.object({
	severity: z.nativeEnum(Severity).optional().or(z.string()),
	facility: z.nativeEnum(Facility).optional().or(z.string()),
	msg: z.preprocess((arg) => (arg ? arg : undefined), z.string().optional()),
	date: z.date().optional(),
	url: z.preprocess(
		(arg) => (arg ? arg : undefined),
		z.string().url().optional()
	),
	task_id: z.preprocess((arg) => (arg ? arg : undefined), z.string().optional())
});

export const ImportRunMutationResponseSchema = z.object({
	taskId: z.string().optional().nullable(),
	url: z.string().nullable()
});

export const ImportRunMutationRequestSchema = z.object({
	celery_task_id: z.string()
});

export type LogEvent = z.infer<typeof LogEventSchema>;

export type LogQuery = z.infer<typeof LogQuerySchema>;

export type LogApiResponse = LogEvent[];

export type ImportEventResponse = z.infer<
	typeof ImportRunMutationResponseSchema
>;

export type ImportRunApiResponse = z.infer<
	typeof ImportRunMutationRequestSchema
>;

export const ImportJsonLogResponseSchema = z.object({
	asctime: z.string(),
	levelname: z.string(),
	message: z.string(),
	module: z.string()
});

export type ImportJsonLog = z.infer<typeof ImportJsonLogResponseSchema>;
