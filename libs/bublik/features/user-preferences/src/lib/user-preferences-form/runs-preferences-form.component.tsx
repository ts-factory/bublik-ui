/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { Checkbox } from '@/shared/tailwind-ui';

import { useUserPreferences } from './user-preferences.hooks';
import { UserPreferencesSchema } from './user-preference.types';

function RunsPreferencesForm() {
	const { userPreferences, setUserPreferences } = useUserPreferences();
	const { control } = useForm({
		defaultValues: userPreferences,
		resolver: zodResolver(UserPreferencesSchema)
	});

	return (
		<div className="max-w-md">
			<Controller
				name="runs.autoApplyBadgeFilters"
				control={control}
				render={({ field }) => (
					<div>
						<div className="flex items-center">
							<Checkbox
								id="runs-auto-apply-badge-filters"
								checked={field.value}
								onCheckedChange={(checked) => {
									field.onChange(checked);
									setUserPreferences({
										...userPreferences,
										runs: {
											...userPreferences.runs,
											autoApplyBadgeFilters: checked === true
										}
									});
								}}
							/>
							<label
								htmlFor="runs-auto-apply-badge-filters"
								className="pl-2 text-sm font-normal"
							>
								Apply badge filters immediately
							</label>
						</div>
						<p className="text-xs text-text-menu ml-8">
							Sync runs table badge clicks to fetched filters right away
						</p>
					</div>
				)}
			></Controller>
		</div>
	);
}

export { RunsPreferencesForm };
