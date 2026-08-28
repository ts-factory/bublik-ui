/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useRef } from 'react';
import { useController, useFormContext } from 'react-hook-form';

import { CheckboxField } from '@/shared/tailwind-ui';
import {
	CATEGORY_META,
	CATEGORY_ORDER,
	IssuePicker
} from '@/bublik/features/result-classification';
import { useProjectSearch } from '@/bublik/features/projects';

import { FormSection, FormSectionSubheader } from '../components';
import { HistoryGlobalSearchFormValues } from '../global-search-form.types';

/**
 * Taken from the badge vocabulary rather than restated here. This list used to
 * be a hand-copied duplicate carrying the long forms — `Product defect`,
 * `Test/automation bug` — while the badges these checkboxes filter for read
 * `Defect` and `Test bug`, so the form named things the results did not.
 *
 * Reusing `CATEGORY_META` also means a seventh category cannot appear in the
 * app without appearing here.
 */
const CATEGORY_OPTIONS = CATEGORY_ORDER.map((category) => ({
	value: category,
	label: CATEGORY_META[category].label,
	iconName: CATEGORY_META[category].iconName
}));

/**
 * Control for the `issue` param, which is otherwise reachable only by deep
 * link — and a deep link the user cannot see, change or clear is a dead end.
 */
const IssueField = () => {
	const { control } = useFormContext<HistoryGlobalSearchFormValues>();
	const { projectIds } = useProjectSearch();
	const { field } = useController({ name: 'issue', control });
	const portalRef = useRef<HTMLDivElement>(null);

	// The picker shows and clears its own selection now, so the "Filtering by
	// issue #42" line and its Clear button that used to sit under it are gone —
	// they existed only because the old input could not say what was chosen.
	//
	// The popup portals into `portalRef` rather than to `document.body`, the same
	// way the test path field does: this form lives in a modal drawer, and Radix
	// reads a click on a body-level popup as a click outside the dialog — which
	// dismisses the drawer instead of selecting the option.
	return (
		<div ref={portalRef}>
			<IssuePicker
				projectId={projectIds[0]}
				value={field.value}
				onChange={(id) => field.onChange(id)}
				container={portalRef}
			/>
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
						label="Untriaged"
						control={control}
					/>
					<CheckboxField
						iconName="InformationCircleCheckmark"
						iconSize={16}
						name="explained"
						label="Explained"
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
							iconName={option.iconName}
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
