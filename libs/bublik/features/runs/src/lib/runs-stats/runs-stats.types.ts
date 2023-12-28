/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { z } from 'zod';

import { RUN_STATUS } from '@/shared/types';

export const RunsStatsSchema = z.object({
	date: z.date(),
	runId: z.string(),
	runStatus: z.nativeEnum(RUN_STATUS),
	total: z.number(),
	nok: z.number(),
	ok: z.number(),
	passrate: z.number(),
	nokPercent: z.number(),
	okPercent: z.number(),
	planPercent: z.number()
});

export type RunStats = z.infer<typeof RunsStatsSchema>;

export const GroupedStatsSchema = z.object({
	date: z.date(),
	[RUN_STATUS.Busy]: z.number(),
	[RUN_STATUS.Compromised]: z.number(),
	[RUN_STATUS.Error]: z.number(),
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

export type TestGroupedByWeek = z.infer<typeof TestByWeekDaySchema>;
