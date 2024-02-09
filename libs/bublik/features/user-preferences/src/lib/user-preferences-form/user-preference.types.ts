/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { z } from 'zod';

export const UserPreferencesSchema = z
	.object({
		history: z
			.object({
				defaultMode: z
					.enum(['linear', 'aggregation', 'measurements'])
					.default('linear')
			})
			.default({ defaultMode: 'linear' }),
		log: z
			.object({ makeExperimentalModeDefault: z.boolean().default(false) })
			.default({ makeExperimentalModeDefault: false })
	})
	.default({
		history: { defaultMode: 'linear' },
		log: { makeExperimentalModeDefault: false }
	});

export const USER_PREFERENCES_DEFAULTS = UserPreferencesSchema.parse({});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
