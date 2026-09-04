/* SPDX-License-Identifier: Apache-2.0 */
import type { RefObject } from 'react';
import { Controller } from 'react-hook-form';

import {
	ErrorMessage,
	FormAlertError,
	FormSection,
	FormSectionSubheader,
	Input,
	SelectInput
} from '@/shared/tailwind-ui';

import { CATEGORY_OPTIONS } from '../shared/category.constants';
import { IssuePicker } from '../pickers/issue-picker.container';
import { MatchScope } from '../rule-form/match-scope.component';
import { splitBugKey } from '../shared/bug-key.utils';
import {
	TrackerCombobox,
	useTrackerOptions
} from '../pickers/tracker-combobox.container';
import { ClassifyForm } from './classify-form.types';

export function ClassifyFields({
	form,
	projectId,
	container
}: {
	form: ClassifyForm;
	projectId?: number;
	container?: RefObject<HTMLElement>;
}) {
	const {
		register,
		control,
		watch,
		setValue,
		formState: { errors }
	} = form;
	const mode = watch('mode');
	const trackerOptions = useTrackerOptions(projectId);

	return (
		<>
			{errors.root?.message ? (
				<FormAlertError title="Error" description={errors.root.message} />
			) : null}

			<FormSection className="flex flex-col">
				<FormSection.Bar className="bg-primary" />
				<FormSection.Header name="Issue" />
				<div className="flex flex-col gap-4">
					<div data-testid="classify-mode">
						<Controller
							control={control}
							name="mode"
							render={({ field }) => (
								<SelectInput
									label="Source"
									value={field.value}
									onValueChange={field.onChange}
									name={field.name}
									options={[
										{ value: 'new', displayValue: 'New issue' },
										{ value: 'existing', displayValue: 'Existing issue' }
									]}
								/>
							)}
						/>
					</div>

					{mode === 'new' ? (
						<>
							<Input
								label="Title"
								placeholder="Short label"
								data-testid="classify-title"
								error={errors.title?.message}
								{...register('title')}
							/>
							<div className="flex gap-4">
								<div className="w-2/5" data-testid="classify-tracker">
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
												data-testid="classify-bug-key"
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
						</>
					) : (
						<div data-testid="classify-issue">
							<Controller
								control={control}
								name="issueId"
								render={({ field }) => (
									<IssuePicker
										label="Issue"
										projectId={projectId}
										value={field.value}
										onChange={(id) => field.onChange(id)}
										container={container}
									/>
								)}
							/>
							{errors.issueId?.message ? (
								<ErrorMessage>{errors.issueId.message}</ErrorMessage>
							) : null}
						</div>
					)}
				</div>
			</FormSection>

			<FormSection className="flex flex-col">
				<FormSection.Bar className="bg-bg-warning" />
				<FormSection.Header name="Classification" />
				<div className="flex flex-col gap-4">
					<div data-testid="classify-category">
						<Controller
							control={control}
							name="category"
							render={({ field }) => (
								<SelectInput
									label="Category"
									value={field.value}
									onValueChange={field.onChange}
									name={field.name}
									options={CATEGORY_OPTIONS}
								/>
							)}
						/>
						{errors.category?.message ? (
							<ErrorMessage>{errors.category.message}</ErrorMessage>
						) : null}
					</div>

					<div data-testid="classify-expected">
						<Controller
							control={control}
							name="expected"
							render={({ field }) => (
								<SelectInput
									label="Expected"
									value={field.value}
									onValueChange={field.onChange}
									name={field.name}
									options={[
										{ value: 'none', displayValue: "Don't change" },
										{ value: 'expected', displayValue: 'Expected' },
										{ value: 'unexpected', displayValue: 'Unexpected' }
									]}
								/>
							)}
						/>
						{errors.expected?.message ? (
							<ErrorMessage>{errors.expected.message}</ErrorMessage>
						) : null}
					</div>
				</div>
			</FormSection>

			<FormSection className="flex flex-col">
				<FormSection.Bar className="bg-bg-interrupted" />
				<FormSection.Header name="Scope" />
				<div className="mb-5">
					<div data-testid="classify-scope">
						<Controller
							control={control}
							name="scope"
							render={({ field }) => (
								<SelectInput
									label="Apply to"
									value={field.value}
									onValueChange={field.onChange}
									name={field.name}
									options={[
										{
											value: 'future',
											displayValue: 'This + future matching runs'
										},
										{ value: 'oneoff', displayValue: 'Just this result' }
									]}
								/>
							)}
						/>
						{errors.scope?.message ? (
							<ErrorMessage>{errors.scope.message}</ErrorMessage>
						) : null}
					</div>
				</div>
				<div>
					<FormSectionSubheader name="Match scope" />
					<MatchScope form={form} />
				</div>
			</FormSection>
		</>
	);
}
