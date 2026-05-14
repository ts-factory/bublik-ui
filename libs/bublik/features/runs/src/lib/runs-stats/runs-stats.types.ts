/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { z } from 'zod';

import { RUN_STATUS } from '@/shared/types';

const RunIdsSchema = z
	.array(z.union([z.string(), z.number()]))
	.transform((ids) => ids.map(String));

export const RunIdsByStatusSchema = z.object({
	[RUN_STATUS.Busy]: RunIdsSchema,
	[RUN_STATUS.Compromised]: RunIdsSchema,
	[RUN_STATUS.Error]: RunIdsSchema,
	[RUN_STATUS.Interrupted]: RunIdsSchema,
	[RUN_STATUS.Ok]: RunIdsSchema,
	[RUN_STATUS.Running]: RunIdsSchema,
	[RUN_STATUS.Stopped]: RunIdsSchema,
	[RUN_STATUS.Warning]: RunIdsSchema
});

export type RunIdsByStatus = z.infer<typeof RunIdsByStatusSchema>;

export const RunsChartBucketSchema = z.object({
	date: z.date(),
	tests: z.object({
		total: z.number(),
		nok: z.number(),
		ok: z.number(),
		passrate: z.number()
	}),
	runIdsByStatus: RunIdsByStatusSchema
});

export type RunsChartBucket = z.infer<typeof RunsChartBucketSchema>;

export const GroupedStatsSchema = z.object({
	date: z.date(),
	[RUN_STATUS.Busy]: z.number(),
	[RUN_STATUS.Compromised]: z.number(),
	[RUN_STATUS.Error]: z.number(),
	[RUN_STATUS.Interrupted]: z.number(),
	[RUN_STATUS.Ok]: z.number(),
	[RUN_STATUS.Running]: z.number(),
	[RUN_STATUS.Stopped]: z.number(),
	[RUN_STATUS.Warning]: z.number(),
	ids: z.string()
});

export type GroupedStats = z.infer<typeof GroupedStatsSchema>;

export const TestByWeekDaySchema = z.object({
	date: z.date(),
	total: z.number(),
	ok: z.number(),
	nok: z.number(),
	passrate: z.number(),
	ids: z.string()
});

export type TestGroupedByDate = z.infer<typeof TestByWeekDaySchema>;
