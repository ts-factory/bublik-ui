/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */

import { useLocalStorage } from '@/shared/hooks';
import { LogPageMode } from '@/shared/types';

import {
	USER_PREFERENCES_DEFAULTS,
	UserPreferencesSchema,
	UserPreferences
} from './user-preference.types';

export function useUserPreferences() {
	const USER_PREFERENCES_KEY = 'user-preferences';
	const [storedUserPreferences, setStoredUserPreferences] =
		useLocalStorage<UserPreferences>(
			USER_PREFERENCES_KEY,
			USER_PREFERENCES_DEFAULTS
		);
	const userPreferences = UserPreferencesSchema.parse(storedUserPreferences);

	const setUserPreferences = (
		value: UserPreferences | ((val: UserPreferences) => UserPreferences)
	) => {
		if (typeof value === 'function') {
			setStoredUserPreferences((currentValue) =>
				UserPreferencesSchema.parse(
					value(UserPreferencesSchema.parse(currentValue))
				)
			);
			return;
		}

		setStoredUserPreferences(UserPreferencesSchema.parse(value));
	};

	return { userPreferences, setUserPreferences };
}

/** The pages whose log links have a layout of their own in the preferences. */
export type LogLinkSource = 'runs' | 'history';

/**
 * The layout an in-app log link is built with, from Settings › Preferences:
 * the one chosen for `source` when the link is on the Runs or History page,
 * the default one anywhere else. Pass it as `mode` to `routes.log`. It is
 * applied when a link is built, never when a log URL is read, so a shared URL
 * keeps its own `mode` and a bare one stays log-only.
 */
export function useDefaultLogMode(source?: LogLinkSource): LogPageMode {
	const { userPreferences } = useUserPreferences();

	if (source === 'runs') return userPreferences.log.runsMode;
	if (source === 'history') return userPreferences.log.historyMode;

	return userPreferences.log.defaultMode;
}
