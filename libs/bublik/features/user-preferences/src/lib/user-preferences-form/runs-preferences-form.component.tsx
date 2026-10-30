/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { useUserPreferences } from './user-preferences.hooks';
import { UserPreferencesSchema } from './user-preference.types';
import { PreferenceSwitch } from './preference-controls.component';

function RunsPreferencesForm() {
	const { userPreferences, setUserPreferences } = useUserPreferences();
	const { control } = useForm({
		defaultValues: userPreferences,
		resolver: zodResolver(UserPreferencesSchema)
	});

	return (
		<Controller
			name="runs.autoApplyBadgeFilters"
			control={control}
			render={({ field }) => (
				<PreferenceSwitch
					label="Apply badge filters immediately"
					description="Sync runs table badge clicks to fetched filters right away"
					checked={field.value}
					onCheckedChange={(checked) => {
						field.onChange(checked);
						setUserPreferences({
							...userPreferences,
							runs: { ...userPreferences.runs, autoApplyBadgeFilters: checked }
						});
					}}
				/>
			)}
		></Controller>
	);
}

export { RunsPreferencesForm };
