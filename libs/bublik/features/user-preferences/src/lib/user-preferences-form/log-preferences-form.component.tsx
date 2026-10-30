/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { LogPageMode, isLogPageMode } from '@/shared/types';
import { RadioCard, RadioGroup } from '@/shared/tailwind-ui';

import { useUserPreferences } from './user-preferences.hooks';
import { UserPreferencesSchema } from './user-preference.types';
import { LogLayoutPreview } from './log-layout-preview.component';
import {
	PreferenceGroupHeading,
	PreferenceSwitch
} from './preference-controls.component';

const DEFAULT_LOG_LAYOUT_LABEL_ID = 'default-log-layout-label';

const LOG_LAYOUT_OPTIONS: ReadonlyArray<{
	value: LogPageMode;
	label: string;
	description: string;
}> = [
	{
		value: LogPageMode.TreeAndInfoAndLog,
		label: 'Tree + info + log',
		description: 'The result tree, the run info and the log'
	},
	{
		value: LogPageMode.TreeAndLog,
		label: 'Tree + log',
		description: 'The result tree and the log'
	},
	{
		value: LogPageMode.InfoAndLog,
		label: 'Info + log',
		description: 'The run info and the log'
	},
	{
		value: LogPageMode.Log,
		label: 'Log only',
		description: 'The log on its own'
	}
];

function LogPreferencesForm() {
	const { userPreferences, setUserPreferences } = useUserPreferences();
	const { control } = useForm({
		defaultValues: userPreferences,
		resolver: zodResolver(UserPreferencesSchema)
	});

	return (
		<div className="flex flex-col gap-6">
			<Controller
				name="log.defaultMode"
				control={control}
				render={({ field }) => (
					<div className="flex flex-col gap-3">
						<PreferenceGroupHeading
							id={DEFAULT_LOG_LAYOUT_LABEL_ID}
							title="Default log layout"
							description="Log links in the app open in this layout. A shared link opens as it was sent."
						/>
						<RadioGroup
							aria-labelledby={DEFAULT_LOG_LAYOUT_LABEL_ID}
							value={field.value}
							onValueChange={(value) => {
								if (!isLogPageMode(value)) return;

								field.onChange(value);
								setUserPreferences({
									...userPreferences,
									log: { ...userPreferences.log, defaultMode: value }
								});
							}}
							className="grid-cols-2 md:grid-cols-4"
						>
							{LOG_LAYOUT_OPTIONS.map((option) => (
								<RadioCard
									key={option.value}
									value={option.value}
									title={option.label}
									description={option.description}
									preview={<LogLayoutPreview mode={option.value} />}
								/>
							))}
						</RadioGroup>
					</div>
				)}
			></Controller>
			<div className="flex flex-col gap-3">
				<Controller
					name="log.preferLegacyLog"
					control={control}
					render={({ field }) => (
						<PreferenceSwitch
							label="Legacy logs"
							description="Make legacy logs your default choice"
							checked={field.value}
							onCheckedChange={(checked) => {
								field.onChange(checked);
								setUserPreferences({
									...userPreferences,
									log: { ...userPreferences.log, preferLegacyLog: checked }
								});
							}}
						/>
					)}
				></Controller>
				<Controller
					name="log.rememberAllPages"
					control={control}
					render={({ field }) => (
						<PreferenceSwitch
							label='Remember "All pages" for 24 hours'
							description='Reopen each test or package in "All pages" mode within the same run'
							checked={field.value}
							onCheckedChange={(checked) => {
								field.onChange(checked);
								setUserPreferences({
									...userPreferences,
									log: { ...userPreferences.log, rememberAllPages: checked }
								});
							}}
						/>
					)}
				></Controller>
			</div>
		</div>
	);
}

export { LogPreferencesForm };
