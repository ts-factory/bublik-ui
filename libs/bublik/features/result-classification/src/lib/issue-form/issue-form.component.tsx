/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { type RefObject } from 'react';
import { Controller } from 'react-hook-form';

import { bublikAPI } from '@/services/bublik-api';
import {
	ErrorMessage,
	FormAlertError,
	Input,
	MarkdownEditor,
	SelectInput
} from '@/shared/tailwind-ui';

import { DESCRIPTION_MARKDOWN_CLASS } from '../classification/classification.constants';
import { splitBugKey } from '../shared/bug-key.utils';
import {
	ISSUE_STATE_SELECT_OPTIONS,
	SelectedOptionHint
} from '../shared/select-options';
import { useDefaultTracker } from '../shared/tracker-default.hooks';
import {
	TrackerCombobox,
	useTrackerOptions
} from '../pickers/tracker-combobox.container';
import { IssueForm } from './issue-form.types';

export interface IssueFieldsProps {
	form: IssueForm;
	projectId?: number;
	mode: 'create' | 'edit';
	/** The project is fixed by where the form was opened, so it is not shown. */
	lockProject?: boolean;
	container?: RefObject<HTMLElement>;
}

export function IssueFields({
	form,
	projectId,
	mode,
	lockProject = false,
	container
}: IssueFieldsProps) {
	const {
		register,
		control,
		watch,
		setValue,
		formState: { errors }
	} = form;
	const project = watch('project');
	const { options: trackerOptions, defaultTracker } = useTrackerOptions(
		project || projectId
	);
	const showProject = mode === 'create' && !lockProject;

	useDefaultTracker(form, defaultTracker);

	return (
		<>
			{errors.root?.message ? (
				<FormAlertError title="Error" description={errors.root.message} />
			) : null}

			{/* Grows into the drawer's free height, which the description takes. */}
			<div className="flex flex-col flex-1 gap-4">
				{showProject ? <IssueProjectField form={form} /> : null}

				<Input
					label="Title"
					placeholder="Short label"
					data-testid="issue-title"
					error={errors.title?.message}
					{...register('title')}
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
									label="Bug Key"
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
					<div data-testid="issue-state">
						<Controller
							control={control}
							name="state"
							render={({ field }) => (
								<>
									<SelectInput
										label="State"
										value={field.value}
										onValueChange={field.onChange}
										name={field.name}
										options={ISSUE_STATE_SELECT_OPTIONS}
									/>
									<SelectedOptionHint
										options={ISSUE_STATE_SELECT_OPTIONS}
										value={field.value}
									/>
								</>
							)}
						/>
					</div>
				) : null}

				<MarkdownEditor
					label="Description"
					minRows={6}
					fill
					breaks
					placeholder="Optional — what is actually wrong, for whoever triages this next"
					data-testid="issue-description"
					previewClassName={DESCRIPTION_MARKDOWN_CLASS}
					error={errors.description?.message}
					{...register('description')}
				/>
			</div>
		</>
	);
}

function IssueProjectField({ form }: { form: IssueForm }) {
	const {
		control,
		formState: { errors }
	} = form;
	const { data: projects } = bublikAPI.useGetAllProjectsQuery();

	const projectOptions = (projects ?? []).map((item) => ({
		value: String(item.id),
		displayValue: item.name
	}));

	return (
		<div data-testid="issue-project">
			<Controller
				control={control}
				name="project"
				render={({ field }) => (
					<SelectInput
						label="Project"
						placeholder="Select a project"
						value={field.value ? String(field.value) : ''}
						onValueChange={(next) => field.onChange(Number(next))}
						name={field.name}
						options={projectOptions}
					/>
				)}
			/>
			{errors.project?.message ? (
				<ErrorMessage>{errors.project.message}</ErrorMessage>
			) : null}
		</div>
	);
}
