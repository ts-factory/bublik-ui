/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import {
	ButtonTw,
	CheckboxField,
	RadioGroup,
	RadioGroupItem
} from '@/shared/tailwind-ui';

import {
	UserPreferences,
	UserPreferencesSchema
} from './user-preference.types';

export interface UserPreferencesFormProps {
	onSubmit: (form: UserPreferences) => void;
	defaultValues?: UserPreferences;
}

function UserPreferencesForm(props: UserPreferencesFormProps) {
	const { control, handleSubmit } = useForm<UserPreferences>({
		defaultValues: props.defaultValues,
		resolver: zodResolver(UserPreferencesSchema)
	});

	return (
		<form
			onSubmit={handleSubmit(props.onSubmit)}
			className="flex flex-col gap-6 max-w-md"
		>
			<Controller
				name="history.defaultMode"
				control={control}
				render={({ field }) => (
					<div className="flex flex-col gap-4">
						<label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
							Default history mode
						</label>
						<RadioGroup
							onValueChange={field.onChange}
							defaultValue={field.value}
							className="flex flex-col space-y-1"
						>
							<div className="flex items-center gap-1">
								<RadioGroupItem id="linear" value="linear" />
								<label
									htmlFor="linear"
									className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 font-normal"
								>
									Linear
								</label>
							</div>
							<div className="flex items-center gap-1">
								<RadioGroupItem id="aggregation" value="aggregation" />
								<label
									htmlFor="aggregation"
									className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 font-normal"
								>
									Aggregation
								</label>
							</div>
							<div className="flex items-center gap-1">
								<RadioGroupItem id="measurements" value="measurements" />
								<label
									htmlFor="measurements"
									className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 font-normal"
								>
									Measurements
								</label>
							</div>
						</RadioGroup>
					</div>
				)}
			></Controller>
			<div>
				<CheckboxField
					name="log.makeExperimentalModeDefault"
					label="Experimental Logs"
					control={control}
				/>
				<p className="text-sm text-text-menu ml-6 mt-1.5">
					Make experimental logs your default choice
				</p>
			</div>
			<div className="self-start">
				<ButtonTw type="submit">Update</ButtonTw>
			</div>
		</form>
	);
}

export { UserPreferencesForm };
