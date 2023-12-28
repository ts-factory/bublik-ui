/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { z } from 'zod';

export const BublikEnvSchema = z.object({
	BASE_URL: z.string(),
	MODE: z.string(),
	DEV: z.boolean(),
	PROD: z.boolean(),
	SSR: z.boolean()
});

export const BublikConfigSchema = z.object({
	baseUrl: z.string(),
	baseUrlApi: z.string(),
	oldBaseUrl: z.string().optional(),
	rootUrl: z.string(),
	dashboardPollingTimer: z.number(),
	isProd: z.boolean(),
	isDev: z.boolean(),
	isSsr: z.boolean(),
	mode: z.string()
});

export type BublikEnv = z.infer<typeof BublikEnvSchema>;

export type BublikConfig = z.infer<typeof BublikConfigSchema>;
