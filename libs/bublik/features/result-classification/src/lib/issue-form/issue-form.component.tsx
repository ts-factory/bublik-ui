/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { type RefObject } from 'react';
import { Controller } from 'react-hook-form';

import {
	FormAlertError,
	Input,
	SelectInput,
	TextArea
} from '@/shared/tailwind-ui';

import { splitBugKey } from '../shared/bug-key.utils';
import {
	TrackerCombobox,
	useTrackerOptions
} from '../pickers/tracker-combobox.container';
import { IssueForm } from './issue-form.types';

export interface IssueFieldsProps {
	form: IssueForm;
	projectId?: number;
	mode: 'create' | 'edit';
	container?: RefObject<HTMLElement>;
}

export function IssueFields({
	form,
	projectId,
	mode,
	container
}: IssueFieldsProps) {
	const {
		register,
		control,
		setValue,
		formState: { errors }
	} = form;
	const trackerOptions = useTrackerOptions(projectId);

	return (
		<>
			{errors.root?.message ? (
				<FormAlertError title="Error" description={errors.root.message} />
			) : null}

			<div className="flex flex-col gap-4">
				<Input
					label="Title"
					placeholder="Short label"
					data-testid="issue-title"
					error={errors.title?.message}
					{...register('title')}
				/>

				<TextArea
					label="Description"
					rows={3}
					placeholder="Optional — what is actually wrong, for whoever triages this next"
					data-testid="issue-description"
					error={errors.description?.message}
					{...register('description')}
				/>

				<div className="flex gap-4">
					<div className="w-2/5" data-testid="issue-tracker">
						<Controller
							control={control}
							name="tracker"
							render={({ field }) => (
								<TrackerCombobox
									value={field.value ?? ''}
									onChange={field.onChange}
									options={trackerOptions}
									error={errors.tracker?.message}
									container={container}
								/>
							)}
						/>
					</div>
					<div className="flex-1">
						<Controller
							control={control}
							name="bugKey"
							render={({ field }) => (
								<Input
									label="Bug key"
									placeholder="Optional — FOO-123"
									data-testid="issue-bug-key"
									name={field.name}
									ref={field.ref}
									onBlur={field.onBlur}
									value={field.value ?? ''}
									error={errors.bugKey?.message}
									onChange={(event) => {
										const next = event.target.value;
										const split = splitBugKey(next, trackerOptions);

										if (!split) {
											field.onChange(next);
											return;
										}

										setValue('tracker', split.tracker, {
											shouldValidate: true
										});
										field.onChange(split.key);
									}}
								/>
							)}
						/>
					</div>
				</div>

				{mode === 'edit' ? (
					<div className="flex flex-col gap-1" data-testid="issue-state">
						<Controller
							control={control}
							name="state"
							render={({ field }) => (
								<SelectInput
									label="State"
									value={field.value}
									onValueChange={field.onChange}
									name={field.name}
									options={[
										{ value: 'open', displayValue: 'Open' },
										{ value: 'closed', displayValue: 'Closed' }
									]}
								/>
							)}
						/>
						<p className="text-xs text-text-menu">
							Closing also deactivates every rule under this issue, and those
							failures start counting again.
						</p>
					</div>
				) : null}
			</div>
		</>
	);
}
