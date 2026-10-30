/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { LogPageMode, isLogPageMode } from '@/shared/types';
import {
	Checkbox,
	RadioGroup,
	RadioGroupItemWithLabel
} from '@/shared/tailwind-ui';

import { useUserPreferences } from './user-preferences.hooks';
import { UserPreferencesSchema } from './user-preference.types';

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
		<div className="max-w-md space-y-4">
			<Controller
				name="log.defaultMode"
				control={control}
				render={({ field }) => (
					<div className="flex flex-col gap-4">
						<label
							id="default-log-layout-label"
							className="text-sm font-medium leading-none"
						>
							Default log layout
						</label>
						<p className="-mt-2 text-xs text-text-menu">
							Log links in the app open in this layout. A shared link opens as
							it was sent.
						</p>
						<RadioGroup
							aria-labelledby="default-log-layout-label"
							value={field.value}
							onValueChange={(value) => {
								if (!isLogPageMode(value)) return;

								field.onChange(value);
								setUserPreferences({
									...userPreferences,
									log: { ...userPreferences.log, defaultMode: value }
								});
							}}
							className="flex flex-col space-y-3"
						>
							{LOG_LAYOUT_OPTIONS.map((option) => (
								<RadioGroupItemWithLabel
									key={option.value}
									id={`default-log-layout-${option.value}`}
									value={option.value}
									label={option.label}
									description={option.description}
								/>
							))}
						</RadioGroup>
					</div>
				)}
			></Controller>
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
			<Controller
				name="log.rememberAllPages"
				control={control}
				render={({ field }) => (
					<div>
						<div className="flex items-center">
							<Checkbox
								id="remember-all-log-pages"
								checked={field.value}
								onCheckedChange={(checked) => {
									field.onChange(checked);
									setUserPreferences({
										...userPreferences,
										log: {
											...userPreferences.log,
											rememberAllPages: checked === true
										}
									});
								}}
							/>
							<label
								htmlFor="remember-all-log-pages"
								className="pl-2 text-sm font-normal"
							>
								Remember "All pages" for 24 hours
							</label>
						</div>
						<p className="text-xs text-text-menu ml-8">
							Reopen each test or package in "All pages" mode within the same
							run
						</p>
					</div>
				)}
			></Controller>
		</div>
	);
}

export { LogPreferencesForm };
