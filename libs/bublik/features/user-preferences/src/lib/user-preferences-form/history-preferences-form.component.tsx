/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { RadioCard, RadioGroup } from '@/shared/tailwind-ui';

import { useUserPreferences } from './user-preferences.hooks';
import {
	UserPreferences,
	UserPreferencesSchema
} from './user-preference.types';
import { PreferenceGroupHeading } from './preference-controls.component';

type HistoryMode = UserPreferences['history']['defaultMode'];

const DEFAULT_HISTORY_MODE_LABEL_ID = 'default-history-mode-label';

const HISTORY_MODE_OPTIONS: ReadonlyArray<{
	value: HistoryMode;
	label: string;
	description: string;
}> = [
	{
		value: 'linear',
		label: 'Linear',
		description: 'View history in a linear timeline format'
	},
	{
		value: 'aggregation',
		label: 'Aggregation',
		description: 'Group and aggregate history data'
	},
	{
		value: 'measurements',
		label: 'Measurements',
		description: 'Display detailed measurement data'
	}
];

function isHistoryMode(value: string): value is HistoryMode {
	return HISTORY_MODE_OPTIONS.some((option) => option.value === value);
}

function HistoryPreferencesForm() {
	const { userPreferences, setUserPreferences } = useUserPreferences();
	const { control } = useForm({
		defaultValues: userPreferences,
		resolver: zodResolver(UserPreferencesSchema)
	});

	return (
		<Controller
			name="history.defaultMode"
			control={control}
			render={({ field }) => (
				<div className="flex flex-col gap-3">
					<PreferenceGroupHeading
						id={DEFAULT_HISTORY_MODE_LABEL_ID}
						title="Default history mode"
					/>
					<RadioGroup
						aria-labelledby={DEFAULT_HISTORY_MODE_LABEL_ID}
						value={field.value}
						onValueChange={(value) => {
							if (!isHistoryMode(value)) return;

							field.onChange(value);
							setUserPreferences({
								...userPreferences,
								history: { ...userPreferences.history, defaultMode: value }
							});
						}}
						className="grid-cols-1 sm:grid-cols-3"
					>
						{HISTORY_MODE_OPTIONS.map((option) => (
							<RadioCard
								key={option.value}
								value={option.value}
								title={option.label}
								description={option.description}
							/>
						))}
					</RadioGroup>
				</div>
			)}
		></Controller>
	);
}

export { HistoryPreferencesForm };
