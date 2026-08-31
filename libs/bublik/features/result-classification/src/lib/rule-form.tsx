/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useEffect, type RefObject } from 'react';
import { Controller, useForm, type UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { bublikAPI } from '@/services/bublik-api';
import {
	ErrorMessage,
	FormAlertError,
	FormSection,
	FormSectionSubheader,
	SelectInput
} from '@/shared/tailwind-ui';
import type { IssueCategory, IssueRule } from '@/shared/types';

import { CATEGORY_OPTIONS, defaultExpectedFor } from './category';
import { IssuePicker } from './issue-picker';
import { TestPicker } from './test-picker';
import { useKnownTests } from './use-known-tests';
import {
	MATCHER_HINTS,
	MatcherField,
	MatcherReadOnly,
	itemsToList,
	itemsToParameters,
	listToItems,
	parametersToItems
} from './matcher-fields';

/**
 * A rule as the form holds it.
 *
 * Two fields here are not fields on the serializer. `active` is read-only and
 * moves through `activate` / `deactivate`; the matcher is rejected outright
 * once the rule has stamps. Both are on the form anyway, because they are
 * things someone authoring a rule expects to decide — `useSaveRule` is what
 * turns each into the request the API actually accepts, or into a read-only
 * panel when it accepts none.
 */
const RuleFormShape = z.object({
	project: z.coerce.number().int().positive({ message: 'Select a project' }),
	issue: z.coerce.number().int().positive({ message: 'Select an issue' }),
	test: z.coerce.number().int().positive({ message: 'Select a test' }),
	category: z.string().min(1, { message: 'Category is required' }),
	expected: z.enum(['expected', 'unexpected', 'none']),
	active: z.enum(['active', 'inactive']),
	parameters: z.array(z.object({ id: z.string(), value: z.string() })),
	verdicts: z.array(z.object({ id: z.string(), value: z.string() })),
	tags: z.array(z.object({ id: z.string(), value: z.string() }))
});

export const RuleFormSchema = RuleFormShape;

export type RuleFormValues = z.infer<typeof RuleFormShape>;

export type RuleForm = UseFormReturn<RuleFormValues>;

/** `expected` is tri-state on the wire and a three-way select in the form. */
export function expectedToKey(
	expected: boolean | null | undefined
): RuleFormValues['expected'] {
	if (expected === true) return 'expected';
	if (expected === false) return 'unexpected';

	return 'none';
}

export function keyToExpected(key: RuleFormValues['expected']): boolean | null {
	if (key === 'expected') return true;
	if (key === 'unexpected') return false;

	return null;
}

export interface RuleFormSeed {
	/**
	 * Every field starts from this rule. It does **not** mean "edit this rule" —
	 * that is `RuleDrawer`'s own `rule` prop, and Duplicate deliberately passes
	 * one here and not there: same starting values, create semantics.
	 */
	rule?: IssueRule | null;
	projectId?: number;
	issueId?: number;
	testId?: number;
}

export function ruleToFormValues({
	rule,
	projectId,
	issueId,
	testId
}: RuleFormSeed): RuleFormValues {
	return {
		project: rule?.project ?? projectId ?? 0,
		issue: rule?.issue ?? issueId ?? 0,
		test: rule?.test ?? testId ?? 0,
		category: rule?.category ?? 'known-issue',
		expected: expectedToKey(rule?.expected),
		active: rule?.active === false ? 'inactive' : 'active',
		parameters: parametersToItems(rule?.parameters),
		verdicts: listToItems(rule?.verdicts),
		tags: listToItems(rule?.tags)
	};
}

export function useRuleForm(seed: RuleFormSeed): RuleForm {
	return useForm<RuleFormValues>({
		resolver: zodResolver(RuleFormSchema),
		defaultValues: ruleToFormValues(seed)
	});
}

export interface RuleFieldsProps {
	form: RuleForm;
	/** Edit locks identity and the matcher; create leaves everything open. */
	mode: 'create' | 'edit';
	/** Fixed by the page rather than chosen — the issue page pins its issue. */
	lockIssue?: boolean;
	/** The name of a test the option list may not carry. See `TestPicker`. */
	testName?: string | null;
	/** Portal target for the two comboboxes — see `IssuePickerProps.container`. */
	container?: RefObject<HTMLElement>;
}

export function RuleFields({
	form,
	mode,
	lockIssue = false,
	testName,
	container
}: RuleFieldsProps) {
	const {
		control,
		watch,
		setValue,
		formState: { errors, dirtyFields }
	} = form;
	const isEdit = mode === 'edit';

	const project = watch('project');
	const category = watch('category') as IssueCategory;
	const { data: projects } = bublikAPI.useGetAllProjectsQuery();
	// Scoped to the chosen project so the list matches the rule being written;
	// unscoped before one is chosen, which is also what the rules page does.
	const { options: testOptions, isLoading: isTestsLoading } = useKnownTests(
		project || undefined
	);

	// The category carries a default disposition — the same table the server
	// applies in `default_expected_for`. Following it here means the form shows
	// what will happen instead of the server deciding after the fact. Stops the
	// moment the user answers the question themselves.
	const expectedTouched = Boolean(dirtyFields.expected);

	useEffect(() => {
		if (isEdit || expectedTouched || !category) return;

		setValue(
			'expected',
			defaultExpectedFor(category) ? 'expected' : 'unexpected'
		);
	}, [category, isEdit, expectedTouched, setValue]);

	const projectOptions = (projects ?? []).map((item) => ({
		value: String(item.id),
		displayValue: item.name
	}));

	return (
		<>
			{errors.root?.message ? (
				<FormAlertError title="Error" description={errors.root.message} />
			) : null}

			{/* Blue bar, as on the classify drawer's Issue card: this is the same
			    question — which issue, in which project — asked from the other end. */}
			<FormSection className="flex flex-col">
				<FormSection.Bar className="bg-primary" />
				<FormSection.Header name="Rule" />
				<div className="flex flex-col gap-4">
					<div data-testid="rule-project">
						<Controller
							control={control}
							name="project"
							render={({ field }) => (
								<SelectInput
									label="Project"
									value={field.value ? String(field.value) : ''}
									onValueChange={(next) => field.onChange(Number(next))}
									name={field.name}
									disabled={isEdit}
									options={projectOptions}
								/>
							)}
						/>
						{errors.project?.message ? (
							<ErrorMessage>{errors.project.message}</ErrorMessage>
						) : null}
					</div>

					<div data-testid="rule-issue">
						<Controller
							control={control}
							name="issue"
							render={({ field }) => (
								<IssuePicker
									label="Issue"
									projectId={project || undefined}
									value={field.value || null}
									onChange={(id) => field.onChange(id ?? 0)}
									container={container}
								/>
							)}
						/>
						{errors.issue?.message ? (
							<ErrorMessage>{errors.issue.message}</ErrorMessage>
						) : null}
						{isEdit || lockIssue ? (
							<p className="mt-1 text-xs text-text-menu">
								{isEdit
									? 'Fixed for the life of the rule — moving a rule between issues would move its stamps with it.'
									: 'Fixed to the issue you are on.'}
							</p>
						) : null}
					</div>

					<div data-testid="rule-test">
						<Controller
							control={control}
							name="test"
							render={({ field }) => (
								<TestPicker
									options={testOptions}
									isLoading={isTestsLoading}
									value={field.value || null}
									valueName={testName}
									onChange={(id) => field.onChange(id ?? 0)}
									disabled={isEdit}
									error={errors.test?.message}
									container={container}
								/>
							)}
						/>
						{isEdit ? null : (
							<p className="mt-1 text-xs text-text-menu">
								A rule always names a test — it is the only criterion the
								matcher narrows on in the database. Selectable tests are those
								that already carry at least one rule.
							</p>
						)}
					</div>
				</div>
			</FormSection>

			{/* Orange bar, the one both the classify drawer and the history search
			    form give to classification. The two fields here are the whole of
			    what an edit can change. */}
			<FormSection className="flex flex-col">
				<FormSection.Bar className="bg-bg-warning" />
				<FormSection.Header name="Classification" />
				<div className="flex flex-col gap-4">
					<div data-testid="rule-category">
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
						    shared component for fields that rarely fail is the wrong
						    trade. */}
						{errors.category?.message ? (
							<ErrorMessage>{errors.category.message}</ErrorMessage>
						) : null}
					</div>

					<div data-testid="rule-expected">
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
						<p className="mt-1 text-xs text-text-menu">
							Only <strong>Expected</strong> suppresses — and only while the
							issue is open. The other two mark the failure without taking it
							out of the unexpected count.
						</p>
					</div>

					<div data-testid="rule-active">
						<Controller
							control={control}
							name="active"
							render={({ field }) => (
								<SelectInput
									label="Rule"
									value={field.value}
									onValueChange={field.onChange}
									name={field.name}
									options={[
										{ value: 'active', displayValue: 'Active' },
										{ value: 'inactive', displayValue: 'Inactive' }
									]}
								/>
							)}
						/>
						<p className="mt-1 text-xs text-text-menu">
							Active rules apply to future imports. Neither state classifies
							runs that already exist — use “Apply rules” on a run for that.
						</p>
					</div>
				</div>
			</FormSection>

			<FormSection className="flex flex-col">
				<FormSection.Bar className="bg-bg-interrupted" />
				<FormSection.Header name="Match scope" />
				{isEdit ? (
					<div className="flex flex-col gap-3">
						<p className="text-xs text-text-menu">
							Fixed after creation. A rule’s matcher is what its existing stamps
							mean, so changing it would silently rewrite the past — the API
							rejects it with “Create a new rule instead”. Duplicate this rule
							to write a different matcher.
						</p>
						{/* Round-tripped through the same converters the submit uses,
						    so the panel shows what would be sent rather than a second
						    reading of the chips. */}
						<MatcherReadOnly
							parameters={itemsToParameters(watch('parameters'))}
							verdicts={itemsToList(watch('verdicts'))}
							tags={itemsToList(watch('tags'))}
						/>
					</div>
				) : (
					<div className="flex flex-col gap-4">
						<FormSectionSubheader name="Narrow the match" />
						<p className="-mt-2 text-xs text-text-menu">
							Every criterion is exact, and an empty one is ignored. Leave all
							three empty and the rule matches every result of this test.
						</p>
						<MatcherField
							control={control}
							name="parameters"
							label="Parameters"
							hint={MATCHER_HINTS.parameters}
							placeholder="env=ci"
							keyValue
							testId="rule-parameters"
						/>
						<MatcherField
							control={control}
							name="verdicts"
							label="Verdicts"
							hint={MATCHER_HINTS.verdicts}
							placeholder="Press Enter to add a verdict"
							testId="rule-verdicts"
						/>
						<MatcherField
							control={control}
							name="tags"
							label="Tags"
							hint={MATCHER_HINTS.tags}
							placeholder="branch=main"
							keyValue
							testId="rule-tags"
						/>
					</div>
				)}
			</FormSection>
		</>
	);
}
