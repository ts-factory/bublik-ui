/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useEffect, type RefObject } from 'react';
import { Controller, useForm, type UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import {
	FormAlertError,
	FormSection,
	Input,
	SelectInput,
	TextArea
} from '@/shared/tailwind-ui';
import type { Issue } from '@/shared/types';

import { refineBugKeyHalves, splitBugKey } from './bug-key';
import { TrackerCombobox, useTrackerOptions } from './tracker-combobox';

/**
 * The issue as the form holds it.
 *
 * `state` is here even though `IssueSerializer` marks it read-only — the
 * lifecycle moves through `close` / `reopen`, not through a PATCH. Keeping it
 * on the form is the point: someone editing an issue expects "open or closed"
 * to be one of the things they can change, and `useSaveIssue` is what turns the
 * field into the extra request the API requires.
 */
const IssueFormShape = z.object({
	title: z.string().min(1, { message: 'Title is required' }),
	description: z.string().optional(),
	/**
	 * The two halves of a bug key, held apart because nobody types a URI. They
	 * are joined into `ref://TRACKER/KEY` on submit — see `composeBugKey`.
	 */
	tracker: z.string().optional(),
	bugKey: z.string().optional(),
	state: z.enum(['open', 'closed'])
});

export const IssueFormSchema = IssueFormShape.superRefine((values, ctx) => {
	refineBugKeyHalves(values, ctx);
});

export type IssueFormValues = z.infer<typeof IssueFormShape>;

export type IssueForm = UseFormReturn<IssueFormValues>;

/** What the form started from, so `useSaveIssue` can tell what actually moved. */
export function issueToFormValues(issue?: Issue | null): IssueFormValues {
	const split = issue?.issue_ext?.key ? splitBugKey(issue.issue_ext.key) : null;

	return {
		title: issue?.title ?? '',
		description: issue?.description ?? '',
		tracker: split?.tracker ?? '',
		bugKey: split?.key ?? '',
		state: issue?.state ?? 'open'
	};
}

export function useIssueForm(issue?: Issue | null): IssueForm {
	const form = useForm<IssueFormValues>({
		resolver: zodResolver(IssueFormSchema),
		defaultValues: issueToFormValues(issue)
	});

	// The drawer mounts before `getIssue` resolves when it is opened from a deep
	// link, so the defaults above can be a blank issue. Reset once the real one
	// lands — but only while the form is untouched, or this would throw away
	// what the user has typed underneath them.
	const isDirty = form.formState.isDirty;

	useEffect(() => {
		if (!issue || isDirty) return;

		form.reset(issueToFormValues(issue));
		// `form` is stable across renders; listing it re-runs this on every
		// keystroke, which is exactly the reset we are trying to avoid.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [issue, isDirty]);

	return form;
}

export interface IssueFieldsProps {
	form: IssueForm;
	projectId?: number;
	/** Edit mode gains the lifecycle select; a new issue is always born open. */
	mode: 'create' | 'edit';
	/** Portal target for the tracker popup — see `IssuePickerProps.container`. */
	container?: RefObject<HTMLElement>;
}

/**
 * Deliberately the classify drawer's Issue section, field for field. Someone
 * who has created an issue by classifying a result and then opens the issue
 * editor should be looking at the same form, not at a second dialect of it.
 */
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

			<FormSection className="flex flex-col">
				<FormSection.Bar className="bg-primary" />
				<FormSection.Header name="Issue" />
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

					{/* Tracker and key side by side: they are one identifier, and
					    stacking them read as two unrelated optional fields. */}
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
											// Pasting a whole `ref://JIRA/FOO-123` — off a badge,
											// out of a chat — should fill both fields rather than
											// fail validation.
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
				</div>
			</FormSection>

			{mode === 'edit' ? (
				// Its own section, and the orange bar, because this is not another
				// property of the issue — it is the switch that decides whether every
				// failure under it still counts. `IssueStateToggle` carries the same
				// warning in a tooltip; here there is room to simply say it.
				<FormSection className="flex flex-col">
					<FormSection.Bar className="bg-bg-warning" />
					<FormSection.Header name="Lifecycle" />
					<div className="flex flex-col gap-2" data-testid="issue-state">
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
							Closing also deactivates every active rule, and un-suppresses
							every result they were hiding — those failures start counting
							again. Reopening does not switch the rules back on.
						</p>
					</div>
				</FormSection>
			) : null}
		</>
	);
}
