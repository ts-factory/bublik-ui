/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { z } from 'zod';

import { LOG_PAGE_MODES, LogPageMode } from '@/shared/types';

const LOG_DEFAULTS = {
	preferLegacyLog: false,
	rememberAllPages: true,
	defaultMode: LogPageMode.TreeAndInfoAndLog
};

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
			.object({
				preferLegacyLog: z.boolean().default(false),
				rememberAllPages: z.boolean().default(true),
				/**
				 * The layout in-app log links are built with. Applied when a link is
				 * built, never when a URL is read: a bare log URL stays log-only.
				 */
				defaultMode: z
					.enum(LOG_PAGE_MODES)
					.default(LOG_DEFAULTS.defaultMode)
					.catch(LOG_DEFAULTS.defaultMode)
			})
			.default(LOG_DEFAULTS),
		runs: z
			.object({ autoApplyBadgeFilters: z.boolean().default(true) })
			.default({ autoApplyBadgeFilters: true })
	})
	.default({
		history: { defaultMode: 'linear' },
		log: LOG_DEFAULTS,
		runs: { autoApplyBadgeFilters: true }
	})
	.catch({
		history: { defaultMode: 'linear' },
		log: LOG_DEFAULTS,
		runs: { autoApplyBadgeFilters: true }
	});

export const USER_PREFERENCES_DEFAULTS = UserPreferencesSchema.parse({});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
