/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { Checkbox } from '@/shared/tailwind-ui';

import { useUserPreferences } from './user-preferences.hooks';
import { UserPreferencesSchema } from './user-preference.types';

function LogPreferencesForm() {
	const { userPreferences, setUserPreferences } = useUserPreferences();
	const { control } = useForm({
		defaultValues: userPreferences,
		resolver: zodResolver(UserPreferencesSchema)
	});

	return (
		<div className="max-w-md">
			<Controller
				name="log.preferLegacyLog"
				control={control}
				render={({ field }) => (
					<div>
						<div className="flex items-center">
							<Checkbox
								id="legacy-logs"
								checked={field.value}
								onCheckedChange={(checked) => {
									field.onChange(checked);
									setUserPreferences({
										...userPreferences,
										log: {
											...userPreferences.log,
											preferLegacyLog: checked === true
										}
									});
								}}
							/>
							<label htmlFor="legacy-logs" className="pl-2 text-sm font-normal">
								Legacy Logs
							</label>
						</div>
						<p className="text-xs text-text-menu ml-8">
							Make legacy logs your default choice
						</p>
					</div>
				)}
			></Controller>
		</div>
	);
}

export { LogPreferencesForm };
