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

type LogLayoutField = 'defaultMode' | 'runsMode' | 'historyMode';

/**
 * The layouts log links open in: the default one, then the pages whose links
 * have a layout of their own.
 */
const LOG_LAYOUT_CHOICES: ReadonlyArray<{
	field: LogLayoutField;
	labelId: string;
	title: string;
	description: string;
}> = [
	{
		field: 'defaultMode',
		labelId: 'default-log-layout-label',
		title: 'Default log layout',
		description:
			'Log links in the app open in this layout, except the ones on Runs and History below. A shared link opens as it was sent.'
	},
	{
		field: 'runsMode',
		labelId: 'runs-log-layout-label',
		title: 'Log layout from Runs',
		description: 'The Log link of a run in the runs table opens in this layout.'
	},
	{
		field: 'historyMode',
		labelId: 'history-log-layout-label',
		title: 'Log layout from History',
		description:
			'Log links of the results on the History page open in this layout.'
	}
];

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
			{LOG_LAYOUT_CHOICES.map((choice) => (
				<Controller
					key={choice.field}
					name={`log.${choice.field}`}
					control={control}
					render={({ field }) => (
						<div className="flex flex-col gap-3">
							<PreferenceGroupHeading
								id={choice.labelId}
								title={choice.title}
								description={choice.description}
							/>
							<RadioGroup
								aria-labelledby={choice.labelId}
								value={field.value}
								onValueChange={(value) => {
									if (!isLogPageMode(value)) return;

									field.onChange(value);
									setUserPreferences({
										...userPreferences,
										log: { ...userPreferences.log, [choice.field]: value }
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
			))}
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
