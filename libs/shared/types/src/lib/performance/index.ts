/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */

import { z } from 'zod';

export const PerformanceResponseSchema = z.array(
	z.object({
		label: z.string(),
		url: z.string().url().optional(),
		timeout: z.number().nonnegative()
	})
);

export type PerformanceResponse = z.infer<typeof PerformanceResponseSchema>;
