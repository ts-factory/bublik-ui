/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useEffect, type RefObject } from 'react';
import { Controller } from 'react-hook-form';

import { bublikAPI } from '@/services/bublik-api';
import {
	ErrorMessage,
	FormAlertError,
	FormSection,
	FormSectionSubheader,
	SelectInput
} from '@/shared/tailwind-ui';
import type { IssueCategory } from '@/shared/types';

import { defaultExpectedFor } from '../shared/category.constants';
import {
	CATEGORY_SELECT_OPTIONS,
	EXPECTED_SELECT_OPTIONS,
	FieldHint,
	RULE_ACTIVE_SELECT_OPTIONS,
	SelectedOptionHint
} from '../shared/select-options';
import { IssuePicker } from '../pickers/issue-picker.container';
import { MatcherField, MatcherReadOnly } from './matcher-fields.component';
import { itemsToList, itemsToParameters } from './matcher-fields.utils';
import { RuleForm } from './rule-form.types';
import { RuleTestField } from './rule-test-field.container';

export interface RuleFieldsProps {
	form: RuleForm;
	mode: 'create' | 'edit';
	lockIssue?: boolean;
	testPath?: string | null;
	container?: RefObject<HTMLElement>;
}

export function RuleFields({
	form,
	mode,
	lockIssue = false,
	testPath,
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
						<FieldHint>The project whose results the rule matches.</FieldHint>
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
									disabled={lockIssue || isEdit}
									container={container}
								/>
							)}
						/>
						<FieldHint>The issue matching results are stamped with.</FieldHint>
						{errors.issue?.message ? (
							<ErrorMessage>{errors.issue.message}</ErrorMessage>
						) : null}
					</div>

					<div data-testid="rule-test">
						<Controller
							control={control}
							name="test"
							render={({ field }) => (
								<RuleTestField
									projectId={project || undefined}
									value={field.value}
									initialPath={testPath}
									onChange={field.onChange}
									disabled={isEdit}
									error={errors.test?.message}
									container={container}
								/>
							)}
						/>
						<FieldHint>The test whose results the rule matches.</FieldHint>
					</div>
				</div>
			</FormSection>

			<FormSection className="flex flex-col">
				<FormSection.Bar className="bg-bg-warning" />
				<FormSection.Header name="Classification" />
				<div className="flex flex-col gap-4">
					<div data-testid="rule-category">
						<Controller
							control={control}
							name="category"
							render={({ field }) => (
								<>
									<SelectInput
										label="Category"
										value={field.value}
										onValueChange={field.onChange}
										name={field.name}
										options={CATEGORY_SELECT_OPTIONS}
									/>
									<SelectedOptionHint
										options={CATEGORY_SELECT_OPTIONS}
										value={field.value}
									/>
								</>
							)}
						/>
						{errors.category?.message ? (
							<ErrorMessage>{errors.category.message}</ErrorMessage>
						) : null}
					</div>

					<div data-testid="rule-expected">
						<Controller
							control={control}
							name="expected"
							render={({ field }) => (
								<>
									<SelectInput
										label="Expected"
										value={field.value}
										onValueChange={field.onChange}
										name={field.name}
										options={EXPECTED_SELECT_OPTIONS}
									/>
									<SelectedOptionHint
										options={EXPECTED_SELECT_OPTIONS}
										value={field.value}
									/>
								</>
							)}
						/>
					</div>

					<div data-testid="rule-active">
						<Controller
							control={control}
							name="active"
							render={({ field }) => (
								<>
									<SelectInput
										label="Rule"
										value={field.value}
										onValueChange={field.onChange}
										name={field.name}
										options={RULE_ACTIVE_SELECT_OPTIONS}
									/>
									<SelectedOptionHint
										options={RULE_ACTIVE_SELECT_OPTIONS}
										value={field.value}
									/>
								</>
							)}
						/>
					</div>
				</div>
			</FormSection>

			<FormSection className="flex flex-col">
				<FormSection.Bar className="bg-bg-interrupted" />
				<FormSection.Header name="Match scope" className="mb-0" />
				{isEdit ? (
					<MatcherReadOnly
						parameters={itemsToParameters(watch('parameters'))}
						verdicts={itemsToList(watch('verdicts'))}
						tags={itemsToList(watch('tags'))}
					/>
				) : (
					<>
						<FormSectionSubheader name="Narrow the match" />
						<div className="flex flex-col gap-4">
							<MatcherField
								control={control}
								name="parameters"
								label="Parameters"
								placeholder="env=ci"
								keyValue
								testId="rule-parameters"
							/>
							<MatcherField
								control={control}
								name="verdicts"
								label="Verdicts"
								placeholder="Press Enter to add a verdict"
								testId="rule-verdicts"
							/>
							<MatcherField
								control={control}
								name="tags"
								label="Tags"
								placeholder="branch=main"
								keyValue
								testId="rule-tags"
							/>
						</div>
					</>
				)}
			</FormSection>
		</>
	);
}
