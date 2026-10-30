/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';

import { config } from '@/bublik/config';
import {
	TextField,
	AriaDateRangeField,
	CheckboxField,
	MetaFilterField,
	MetaFilterSuggestionGroup
} from '@/shared/tailwind-ui';
import { RUN_PROPERTIES } from '@/shared/types';

import { FormSection, FormSectionSubheader, FormError } from '../components';
import { HistoryGlobalSearchFormValues } from '../global-search-form.types';
import { HISTORY_FIELD_BADGE_CLASS } from '../global-search-form.constants';
import { useMetaSuggestions } from '../global-search-form.suggestions.hooks';

export type RunSectionProps = {
	onResetRunSectionClick: () => void;
	onResetRunSectionDefaultClick: () => void;
};

const LABEL_HELP_EXAMPLES = [
	'nightly & !weekly',
	'release-1 | release-2',
	'(nightly | weekly) & !broken'
];
const BRANCH_HELP_EXAMPLES = [
	'master | release',
	'!master',
	'branch=main | branch=stable'
];
const REVISION_HELP_EXAMPLES = [
	'rev=8af3831 | rev=c0ffee',
	'rev!=8af3831',
	'(rev=8af3831 | rev=c0ffee) & !dirty'
];
const TAG_HELP_EXAMPLES = [
	'medford & !pci-15b3',
	'pci-15b3 | pci-sub-15b3',
	'(medford | ipv6) & arm64'
];

const KEY_VALUE_DELIMITERS = {
	keyValueDisplayDelimiter: config.keyValueDisplayDelimiter,
	keyValueSubmitDelimiter: config.keyValueSubmitDelimiter
};

function toGroup(
	label: string,
	items: readonly string[],
	className: string
): MetaFilterSuggestionGroup[] {
	return items.length ? [{ label, items, className }] : [];
}

export const RunSection = (props: RunSectionProps) => {
	const { control, formState, watch } =
		useFormContext<HistoryGlobalSearchFormValues>();
	const metaSuggestions = useMetaSuggestions({
		eager: watch('runData').length > 0
	});
	const { importantTags, tags } = metaSuggestions;

	const labelGroups = useMemo(
		() =>
			toGroup(
				'Labels',
				metaSuggestions.labels,
				HISTORY_FIELD_BADGE_CLASS.labels
			),
		[metaSuggestions.labels]
	);
	const branchGroups = useMemo(
		() =>
			toGroup(
				'Branches',
				metaSuggestions.branches,
				HISTORY_FIELD_BADGE_CLASS.branches
			),
		[metaSuggestions.branches]
	);
	const revisionGroups = useMemo(
		() =>
			toGroup(
				'Revisions',
				metaSuggestions.revisions,
				HISTORY_FIELD_BADGE_CLASS.revisions
			),
		[metaSuggestions.revisions]
	);
	const tagGroups = useMemo(
		() => [
			...toGroup(
				'Important',
				tags.filter((tag) => importantTags.has(tag)),
				HISTORY_FIELD_BADGE_CLASS.importantTags
			),
			...toGroup(
				'Tags',
				tags.filter((tag) => !importantTags.has(tag)),
				HISTORY_FIELD_BADGE_CLASS.tags
			)
		],
		[importantTags, tags]
	);
	const tagChipClassName = (tag: string) =>
		importantTags.has(tag)
			? HISTORY_FIELD_BADGE_CLASS.importantTags
			: HISTORY_FIELD_BADGE_CLASS.tags;

	const runPropsError = formState.errors.runProperties?.message as
		| string
		| undefined;

	return (
		<FormSection>
			<FormSection.Bar className="bg-primary" />
			<FormSection.Header name="Run">
				<FormSection.ResetToDefaultButton
					helpMessage="Reset run section to defaults"
					onClick={props.onResetRunSectionDefaultClick}
				/>
				<FormSection.ResetButton
					helpMessage="Clear run section"
					onClick={props.onResetRunSectionClick}
				/>
			</FormSection.Header>
			<div className="flex flex-col gap-4">
				<div className="grid items-center gap-4 md:grid-cols-2">
					<AriaDateRangeField label="Dates" name="dates" control={control} />
					<TextField
						name="runIds"
						label="Run ID"
						placeholder="1"
						control={control}
					/>
				</div>
				<MetaFilterField
					control={control}
					valuesName="labels"
					expressionName="labelExpr"
					variant="form"
					label="Labels"
					name="labels"
					placeholder="label"
					suggestions={labelGroups}
					suggestionsLoading={metaSuggestions.isLoading}
					allowCustomValues={false}
					onSuggestionsRequest={metaSuggestions.request}
					chipClassName={() => HISTORY_FIELD_BADGE_CLASS.labels}
					helpNoun="label"
					helpExamples={LABEL_HELP_EXAMPLES}
					{...KEY_VALUE_DELIMITERS}
				/>
				<MetaFilterField
					control={control}
					valuesName="branches"
					expressionName="branchExpr"
					variant="form"
					label="Branches"
					name="branches"
					placeholder="master"
					suggestions={branchGroups}
					suggestionsLoading={metaSuggestions.isLoading}
					allowCustomValues={false}
					onSuggestionsRequest={metaSuggestions.request}
					chipClassName={() => HISTORY_FIELD_BADGE_CLASS.branches}
					helpNoun="branch"
					helpExamples={BRANCH_HELP_EXAMPLES}
					{...KEY_VALUE_DELIMITERS}
				/>
				<MetaFilterField
					control={control}
					valuesName="revisions"
					expressionName="revisionExpr"
					variant="form"
					label="Revisions"
					name="revisions"
					placeholder="8af383125f20cc5ecdb8393bf"
					suggestions={revisionGroups}
					suggestionsLoading={metaSuggestions.isLoading}
					allowCustomValues={false}
					onSuggestionsRequest={metaSuggestions.request}
					chipClassName={() => HISTORY_FIELD_BADGE_CLASS.revisions}
					helpNoun="revision"
					helpExamples={REVISION_HELP_EXAMPLES}
					{...KEY_VALUE_DELIMITERS}
				/>
				<MetaFilterField
					control={control}
					valuesName="runData"
					expressionName="tagExpr"
					variant="form"
					label="Tags"
					name="runData"
					placeholder="medford"
					suggestions={tagGroups}
					suggestionsLoading={metaSuggestions.isLoading}
					allowCustomValues={false}
					onSuggestionsRequest={metaSuggestions.request}
					chipClassName={tagChipClassName}
					helpNoun="tag"
					helpExamples={TAG_HELP_EXAMPLES}
					{...KEY_VALUE_DELIMITERS}
				/>
			</div>
			<div className="mt-4">
				<FormSectionSubheader name="Compromise Status" />
				{runPropsError ? (
					<div className="mb-3">
						<FormError subtitle={runPropsError} />
					</div>
				) : null}
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<CheckboxField
						iconName="InformationCircleForbidden"
						iconSize={16}
						name="runProperties"
						value={RUN_PROPERTIES.Compromised}
						label="Compromised"
						control={control}
					/>
					<CheckboxField
						iconName="InformationCircleCheckmark"
						iconSize={16}
						name="runProperties"
						value={RUN_PROPERTIES.NotCompromised}
						label="Not Compromised"
						control={control}
					/>
				</div>
			</div>
		</FormSection>
	);
};
