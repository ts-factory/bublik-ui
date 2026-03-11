/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */

import { useLocalStorage } from '@/shared/hooks';

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
