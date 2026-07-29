/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import {
	USER_PREFERENCES_DEFAULTS,
	UserPreferencesSchema
} from './user-preference.types';

describe('UserPreferencesSchema', () => {
	it('remembers all log pages by default', () => {
		expect(USER_PREFERENCES_DEFAULTS.log.rememberAllPages).toBe(true);
	});

	it('adds the default to existing log preferences', () => {
		const preferences = UserPreferencesSchema.parse({
			log: { preferLegacyLog: true }
		});

		expect(preferences.log).toEqual({
			preferLegacyLog: true,
			rememberAllPages: true
		});
	});
});
