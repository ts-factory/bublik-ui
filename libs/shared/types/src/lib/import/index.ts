/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { z } from 'zod';

export const ImportRunsFormSchema = z.object({
	runs: z
		.array(
			z.object({
				url: z.string().url().or(z.string()),
				range: z
					.object({ startDate: z.date(), endDate: z.date() })
					.or(z.null()),
				force: z.boolean().or(z.null())
			})
		)
		.min(1)
});

export type ImportRunsFormValues = z.infer<typeof ImportRunsFormSchema>;

export type ImportRunInput = ImportRunsFormValues['runs'][number];
