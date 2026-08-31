/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useEffect, type RefObject } from 'react';
import { Controller, useForm, type UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import {
	FormAlertError,
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
 * A flat stack of inputs — no cards, no dividers. Shared by both modals, so
 * creating and editing an issue are the same form.
 *
 * The classify drawer groups its fields into three coloured-bar sections
 * because it has three genuinely different subjects — the issue, the verdict,
 * the scope — spread down a full-height panel. This form has one subject and
 * four fields, and chrome around four fields makes a short form look long.
 * `CreateUserForm` is the shape the app already uses here.
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
						{/* One muted line, the shape `Input` gives its own hint text.
						    It stays because closing is the single most surprising thing
						    in the feature: it deactivates every rule under the issue and
						    those failures start counting again. */}
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
