/* SPDX-License-Identifier: Apache-2.0 */
import type { RefObject } from 'react';
import { Controller, useForm, type UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import {
	ErrorMessage,
	FormAlertError,
	FormSection,
	FormSectionSubheader,
	Input,
	SelectInput
} from '@/shared/tailwind-ui';
import type { ClassifyScope, IssueCategory } from '@/shared/types';

import { CATEGORY_OPTIONS } from '../shared/category.constants';
import { IssuePicker } from '../pickers/issue-picker.container';
import { MatchScope } from '../rule-form/match-scope.component';
import { DEFAULT_MATCH_FLAGS } from '../rule-form/match-scope.utils';
import { composeBugKey, refineBugKeyHalves, splitBugKey } from '../shared/bug-key.utils';
import { applyClassifyErrors } from './classify.utils';
import { TrackerCombobox, useTrackerOptions } from '../pickers/tracker-combobox.container';

const ClassifyFormShape = z.object({
	mode: z.enum(['new', 'existing']),
	issueId: z.coerce.number().optional(),
	title: z.string().optional(),
	/**
	 * The two halves of a bug key. They are stored joined as
	 * `ref://TRACKER/KEY` — see `composeBugKey` — but nobody types a URI, so the
	 * form holds them apart.
	 */
	tracker: z.string().optional(),
	bugKey: z.string().optional(),
	category: z.string().min(1, { message: 'Category is required' }),
	scope: z.enum(['future', 'oneoff']),
	expected: z.enum(['expected', 'unexpected', 'none']),
	matchParameters: z.boolean(),
	matchVerdicts: z.boolean(),
	matchImportantTags: z.boolean(),
	matchAllTags: z.boolean()
});

export const ClassifyFormSchema = ClassifyFormShape.superRefine(
	(values, ctx) => {
		const title = values.title?.trim() ?? '';

		if (values.mode === 'existing') {
			if (!values.issueId) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ['issueId'],
					message: 'Select an issue'
				});
			}

			// The rest describes an issue that is about to be created, and under
			// `existing` there is none.
			return;
		}

		if (!title) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['title'],
				message: 'Title is required'
			});
		}

		// Shared with the issue drawer, which collects the same pair.
		refineBugKeyHalves(values, ctx);
	}
);

export type ClassifyFormValues = z.infer<typeof ClassifyFormShape>;

export type ClassifyForm = UseFormReturn<ClassifyFormValues>;

export function useClassifyForm(): ClassifyForm {
	return useForm<ClassifyFormValues>({
		resolver: zodResolver(ClassifyFormSchema),
		defaultValues: {
			mode: 'new',
			title: '',
			tracker: '',
			bugKey: '',
			category: 'known-issue',
			scope: 'future',
			expected: 'none',
			...DEFAULT_MATCH_FLAGS
		}
	});
}

export function buildSubmitHandler(
	submit: (input: {
		issue: number | { title: string; bug_key?: string };
		category: IssueCategory;
		expected: boolean | null;
		scope: ClassifyScope;
		matcher: {
			matchParameters: boolean;
			matchVerdicts: boolean;
			matchImportantTags: boolean;
			matchAllTags: boolean;
		};
	}) => Promise<unknown>,
	form: ClassifyForm,
	onDone: () => void
) {
	return async (values: ClassifyFormValues) => {
		const category = values.category as IssueCategory;
		const issue =
			values.mode === 'existing' && values.issueId
				? values.issueId
				: {
						title: (values.title ?? '').trim(),
						bug_key: composeBugKey(values.tracker, values.bugKey)
				  };

		// Left over from a previous attempt; the field errors are replaced by
		// `setError` below, but a stale root alert would otherwise survive a
		// request that failed for an entirely different reason.
		form.clearErrors('root');

		try {
			await submit({
				issue,
				category,
				expected:
					values.expected === 'expected'
						? true
						: values.expected === 'unexpected'
						? false
						: null,
				scope: values.scope as ClassifyScope,
				matcher: {
					matchParameters: values.matchParameters,
					matchVerdicts: values.matchVerdicts,
					matchImportantTags: values.matchImportantTags,
					matchAllTags: values.matchAllTags
				}
			});
		} catch (error: unknown) {
			// The drawer closes in `onDone` and nowhere else: a rejected classify
			// leaves the form standing with the server's message on the field
			// that caused it.
			applyClassifyErrors(error, form);
			return;
		}

		onDone();
	};
}

export function ClassifyFields({
	form,
	projectId,
	container
}: {
	form: ClassifyForm;
	projectId?: number;
	/** Portal target for the issue picker's popup — see `IssuePickerProps`. */
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

			{/* The three cards mirror the history global search form's sections —
			    same `FormSection` shell, same coloured bar, same uppercase
			    headers. The form's own `gap-6` supplies the spacing between them,
			    which is the gap that form uses too. */}
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
							{/* Tracker and key side by side: they are one identifier, and
							    stacking them read as two unrelated optional fields. */}
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
													// Pasting a whole `ref://JIRA/FOO-123` — off a
													// badge, out of a chat — should fill both
													// fields rather than fail validation.
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

			{/* Orange bar, the same one the history form's Classification section
			    carries — the two forms name the same concept, so they should not
			    pick different colours for it. */}
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
						{/* `SelectInput` has no error slot of its own, and widening a
						    shared component for three fields that rarely fail is the
						    wrong trade. */}
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
				{/* No subheader over the select: its own floating label already
				    reads "Apply to", and the two would sit a handspan apart saying
				    the same words. */}
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
