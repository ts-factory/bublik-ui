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
			.object({ preferLegacyLog: z.boolean().default(false) })
			.default({ preferLegacyLog: false }),
		runs: z
			.object({ autoApplyBadgeFilters: z.boolean().default(true) })
			.default({ autoApplyBadgeFilters: true })
	})
	.default({
		history: { defaultMode: 'linear' },
		log: { preferLegacyLog: false },
		runs: { autoApplyBadgeFilters: true }
	})
	.catch({
		history: { defaultMode: 'linear' },
		log: { preferLegacyLog: false },
		runs: { autoApplyBadgeFilters: true }
	});

export const USER_PREFERENCES_DEFAULTS = UserPreferencesSchema.parse({});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
