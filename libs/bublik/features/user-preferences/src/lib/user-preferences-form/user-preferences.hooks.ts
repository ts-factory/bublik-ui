/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */

import { useLocalStorage } from '@/shared/hooks';

import {
	USER_PREFERENCES_DEFAULTS,
	UserPreferences
} from './user-preference.types';

export function useUserPreferences() {
	const USER_PREFERENCES_KEY = 'user-preferences';
	const [userPreferences, setUserPreferences] =
		useLocalStorage<UserPreferences>(
			USER_PREFERENCES_KEY,
			USER_PREFERENCES_DEFAULTS
		);

	return { userPreferences, setUserPreferences };
}
