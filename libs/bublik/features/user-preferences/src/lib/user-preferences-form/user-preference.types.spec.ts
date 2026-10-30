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
			rememberAllPages: true,
			defaultMode: 'treeAndinfoAndlog'
		});
	});

	it('opens log links with the tree, info and log by default', () => {
		expect(USER_PREFERENCES_DEFAULTS.log.defaultMode).toBe('treeAndinfoAndlog');
	});

	it('keeps a chosen log layout', () => {
		const preferences = UserPreferencesSchema.parse({
			log: { defaultMode: 'infoAndlog' }
		});

		expect(preferences.log.defaultMode).toBe('infoAndlog');
	});

	it('falls back to the default layout for an unknown stored one, keeping the rest', () => {
		const preferences = UserPreferencesSchema.parse({
			history: { defaultMode: 'aggregation' },
			log: { preferLegacyLog: true, defaultMode: 'treeAndeverything' }
		});

		expect(preferences.log.defaultMode).toBe('treeAndinfoAndlog');
		expect(preferences.log.preferLegacyLog).toBe(true);
		expect(preferences.history.defaultMode).toBe('aggregation');
	});
});
