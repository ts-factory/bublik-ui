/* SPDX-License-Identifier: Apache-2.0 */
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import {
	ButtonTw,
	Icon,
	Input,
	Popover,
	PopoverContent,
	PopoverTrigger,
	SelectInput
} from '@/shared/tailwind-ui';
import type { ClassifyScope, Issue, IssueCategory } from '@/shared/types';

import { CATEGORY_OPTIONS, defaultExpectedFor } from './category';
import { useClassify } from './use-classify';

const Schema = z.object({
	mode: z.enum(['new', 'existing']),
	issueId: z.coerce.number().optional(),
	title: z.string().optional(),
	bugKey: z.string().optional(),
	category: z.string().min(1, { message: 'Category is required' }),
	scope: z.enum(['future', 'oneoff'])
});

type FormValues = z.infer<typeof Schema>;

export interface ClassifyPopoverProps {
	resultId: number;
}

export function ClassifyPopover({ resultId }: ClassifyPopoverProps) {
	const [open, setOpen] = useState(false);
	const { issues, submit, canClassify } = useClassify(resultId);

	const { register, control, handleSubmit, watch, formState } =
		useForm<FormValues>({
			resolver: zodResolver(Schema),
			defaultValues: { mode: 'new', category: 'known-issue', scope: 'future' }
		});
	const mode = watch('mode');

	async function onSubmit(values: FormValues) {
		const category = values.category as IssueCategory;
		const issue =
			values.mode === 'existing' && values.issueId
				? values.issueId
				: { title: values.title || 'Untitled', bug_key: values.bugKey || undefined };
		await submit({
			issue,
			category,
			expected: defaultExpectedFor(category),
			scope: values.scope as ClassifyScope
		});
		setOpen(false);
	}

	const issueOptions = (issues.data ?? []).map((i: Issue) => ({
		value: String(i.id),
		displayValue: i.title
	}));

	return (
		<Popover open={open} onOpenChange={setOpen} modal>
			<PopoverTrigger asChild>
				<ButtonTw
					variant="secondary"
					size="xss"
					disabled={!canClassify}
					title={!canClassify ? 'Select a project first' : undefined}
				>
					<Icon name="TriangleExclamationMark" size={18} className="mr-1" />
					Classify
				</ButtonTw>
			</PopoverTrigger>
			<PopoverContent sideOffset={8}>
				<form
					onSubmit={handleSubmit(onSubmit)}
					className="min-w-[320px] p-4 bg-white rounded-md shadow-popover flex flex-col gap-4"
				>
					<span className="text-[0.875rem] font-semibold">
						Classify failure
					</span>

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
								<SelectInput
									label="Pick issue"
									value={field.value ? String(field.value) : ''}
									onValueChange={(v) => field.onChange(Number(v))}
									name={field.name}
									options={issueOptions}
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

					<ButtonTw
						type="submit"
						variant="primary"
						size="md"
						rounded="lg"
						className="justify-center w-full"
					>
						{formState.isSubmitting ? (
							<Icon
								name="ProgressIndicator"
								size={18}
								className="animate-spin"
							/>
						) : (
							'Classify'
						)}
					</ButtonTw>
				</form>
			</PopoverContent>
		</Popover>
	);
}
