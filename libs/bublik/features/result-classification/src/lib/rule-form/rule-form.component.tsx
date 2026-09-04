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

import {
	CATEGORY_OPTIONS,
	defaultExpectedFor
} from '../shared/category.constants';
import { IssuePicker } from '../pickers/issue-picker.container';
import { TestPicker } from '../pickers/test-picker.component';
import { useKnownTests } from './known-tests.hooks';
import { MatcherField, MatcherReadOnly } from './matcher-fields.component';
import { itemsToList, itemsToParameters } from './matcher-fields.utils';
import { RuleForm } from './rule-form.types';

export interface RuleFieldsProps {
	form: RuleForm;
	mode: 'create' | 'edit';
	lockIssue?: boolean;
	testName?: string | null;
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
	const { options: testOptions, isLoading: isTestsLoading } = useKnownTests(
		project || undefined
	);

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
