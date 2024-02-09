/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { toast } from '@/shared/tailwind-ui';

import { useUserPreferences } from './user-preferences.hooks';
import { UserPreferences } from './user-preference.types';
import { UserPreferencesForm } from './user-preferences.component';

export function UserPreferencesFormContainer() {
	const { setUserPreferences, userPreferences } = useUserPreferences();

	function handleSubmit(form: UserPreferences) {
		setUserPreferences(form);
		toast.success('User preferences updated');
	}

	return (
		<UserPreferencesForm
			onSubmit={handleSubmit}
			defaultValues={userPreferences}
		/>
	);
}
