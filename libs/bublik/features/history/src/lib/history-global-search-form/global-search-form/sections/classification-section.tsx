/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useFormContext } from 'react-hook-form';

import { CheckboxField } from '@/shared/tailwind-ui';

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

export const ClassificationSection = () => {
	const { control } = useFormContext<HistoryGlobalSearchFormValues>();

	return (
		<FormSection>
			<FormSection.Bar className="bg-bg-warning" />
			<div className="mb-5">
				<FormSection.Header className="mb-0" name="Classification" />
				<FormSectionSubheader name="Triage state" />
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
					<CheckboxField
						iconName="TriangleExclamationMark"
						iconSize={16}
						name="untriaged"
						label="Untriaged unexpected only"
						control={control}
					/>
				</div>
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
