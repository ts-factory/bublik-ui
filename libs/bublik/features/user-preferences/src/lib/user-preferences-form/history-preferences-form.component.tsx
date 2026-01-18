/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { RadioGroup, RadioGroupItemWithLabel } from '@/shared/tailwind-ui';

import { useUserPreferences } from './user-preferences.hooks';
import { UserPreferencesSchema } from './user-preference.types';

function HistoryPreferencesForm() {
	const { userPreferences, setUserPreferences } = useUserPreferences();
	const { control } = useForm({
		defaultValues: userPreferences,
		resolver: zodResolver(UserPreferencesSchema)
	});

	return (
		<div className="flex flex-col gap-4 max-w-md">
			<Controller
				name="history.defaultMode"
				control={control}
				render={({ field }) => (
					<div className="flex flex-col gap-4">
						<label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
							Default History Mode
						</label>
						<RadioGroup
							onValueChange={(value) => {
								field.onChange(value);
								setUserPreferences({
									...userPreferences,
									history: {
										...userPreferences.history,
										defaultMode: value as
											| 'linear'
											| 'aggregation'
											| 'measurements'
									}
								});
							}}
							defaultValue={field.value}
							className="flex flex-col space-y-3"
						>
							<RadioGroupItemWithLabel
								id="linear"
								value="linear"
								label="Linear"
								description="View history in a linear timeline format"
							/>
							<RadioGroupItemWithLabel
								id="aggregation"
								value="aggregation"
								label="Aggregation"
								description="Group and aggregate history data"
							/>
							<RadioGroupItemWithLabel
								id="measurements"
								value="measurements"
								label="Measurements"
								description="Display detailed measurement data"
							/>
						</RadioGroup>
					</div>
				)}
			></Controller>
		</div>
	);
}

export { HistoryPreferencesForm };
