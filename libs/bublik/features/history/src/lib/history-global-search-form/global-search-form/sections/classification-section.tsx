/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useController, useFormContext } from 'react-hook-form';

import { ButtonTw, CheckboxField } from '@/shared/tailwind-ui';
import { IssuePicker } from '@/bublik/features/result-classification';
import { useProjectSearch } from '@/bublik/features/projects';

import { FormSection, FormSectionSubheader } from '../components';
import { HistoryGlobalSearchFormValues } from '../global-search-form.types';

/** Mirrors the backend IssueCategory values (Plan 2). */
const CATEGORY_OPTIONS: { value: string; label: string }[] = [
	{ value: 'product-defect', label: 'Product defect' },
	{ value: 'test-bug', label: 'Test/automation bug' },
	{ value: 'env', label: 'Environment / infra' },
	{ value: 'known-issue', label: 'Known issue' },
	{ value: 'flaky', label: 'Flaky / intermittent' },
	{ value: 'to-investigate', label: 'To investigate' }
];

/**
 * Control for the `issue` param, which is otherwise reachable only by deep
 * link — and a deep link the user cannot see, change or clear is a dead end.
 */
const IssueField = () => {
	const { control } = useFormContext<HistoryGlobalSearchFormValues>();
	const { projectIds } = useProjectSearch();
	const { field } = useController({ name: 'issue', control });

	return (
		<div className="flex flex-col gap-2">
			<IssuePicker
				projectId={projectIds[0]}
				value={field.value ?? undefined}
				onChange={(id) => field.onChange(id === field.value ? null : id)}
			/>
			{field.value !== null && field.value !== undefined ? (
				<div className="flex items-center gap-2">
					<span className="text-xs text-text-menu">
						Filtering by issue #{field.value}
					</span>
					<ButtonTw
						variant="secondary"
						size="xss"
						onClick={() => field.onChange(null)}
					>
						Clear
					</ButtonTw>
				</div>
			) : null}
		</div>
	);
};

export const ClassificationSection = () => {
	const { control } = useFormContext<HistoryGlobalSearchFormValues>();

	return (
		<FormSection>
			<FormSection.Bar className="bg-bg-warning" />
			<div className="mb-5">
				<FormSection.Header className="mb-0" name="Classification" />
				<FormSectionSubheader name="Triage state" />
				{/* The two halves of the triage question: what still needs a
				    decision, and what already has one. */}
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
					<CheckboxField
						iconName="TriangleExclamationMark"
						iconSize={16}
						name="untriaged"
						label="Untriaged unexpected only"
						control={control}
					/>
					<CheckboxField
						iconName="TriangleQuestionMark"
						iconSize={16}
						name="explained"
						label="Explained only"
						control={control}
					/>
				</div>
			</div>
			<div className="mb-5">
				<FormSectionSubheader name="Issue" />
				<IssueField />
			</div>
			<div>
				<FormSectionSubheader name="Category" />
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
					{CATEGORY_OPTIONS.map((option) => (
						<CheckboxField
							key={option.value}
							iconName="TriangleQuestionMark"
							iconSize={16}
							name="categories"
							value={option.value}
							label={option.label}
							control={control}
						/>
					))}
				</div>
			</div>
		</FormSection>
	);
};
