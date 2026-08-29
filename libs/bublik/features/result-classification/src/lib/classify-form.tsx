/* SPDX-License-Identifier: Apache-2.0 */
import { Controller, useForm, type UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Input, SelectInput } from '@/shared/tailwind-ui';
import type { ClassifyScope, IssueCategory } from '@/shared/types';

import { CATEGORY_OPTIONS } from './category';
import { IssuePicker } from './issue-picker';
import { DEFAULT_MATCH_FLAGS } from './match-scope.utils';

export const ClassifyFormSchema = z.object({
	mode: z.enum(['new', 'existing']),
	issueId: z.coerce.number().optional(),
	title: z.string().optional(),
	bugKey: z.string().optional(),
	category: z.string().min(1, { message: 'Category is required' }),
	scope: z.enum(['future', 'oneoff']),
	expected: z.enum(['expected', 'unexpected', 'none']),
	matchParameters: z.boolean(),
	matchVerdicts: z.boolean(),
	matchImportantTags: z.boolean(),
	matchAllTags: z.boolean()
});

export type ClassifyFormValues = z.infer<typeof ClassifyFormSchema>;

export type ClassifyForm = UseFormReturn<ClassifyFormValues>;

export function useClassifyForm(): ClassifyForm {
	return useForm<ClassifyFormValues>({
		resolver: zodResolver(ClassifyFormSchema),
		defaultValues: {
			mode: 'new',
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
	}) => Promise<unknown> | undefined,
	onDone: () => void
) {
	return async (values: ClassifyFormValues) => {
		const category = values.category as IssueCategory;
		const issue =
			values.mode === 'existing' && values.issueId
				? values.issueId
				: {
						title: values.title || 'Untitled',
						bug_key: values.bugKey || undefined
				  };
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
		onDone();
	};
}

export function ClassifyFields({
	form,
	projectId
}: {
	form: ClassifyForm;
	projectId?: number;
}) {
	const { register, control, watch } = form;
	const mode = watch('mode');

	return (
		<>
			<Controller
				control={control}
				name="mode"
				render={({ field }) => (
					<SelectInput
						label="Issue"
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

			{mode === 'new' ? (
				<>
					<Input
						label="Title"
						placeholder="Short label"
						{...register('title')}
					/>
					<Input
						label="Bug key (optional)"
						placeholder="ref://JIRA/ISSUE-123"
						{...register('bugKey')}
					/>
				</>
			) : (
				<Controller
					control={control}
					name="issueId"
					render={({ field }) => (
						<IssuePicker
							projectId={projectId}
							value={field.value}
							onChange={(id) => field.onChange(id)}
						/>
					)}
				/>
			)}

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
							{ value: 'future', displayValue: 'This + future matching runs' },
							{ value: 'oneoff', displayValue: 'Just this result' }
						]}
					/>
				)}
			/>
		</>
	);
}
