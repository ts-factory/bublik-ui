/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useMemo, useRef } from 'react';
import { useFormContext } from 'react-hook-form';

import { config } from '@/bublik/config';
import { TestPathComboboxField } from '@/bublik/features/result-classification';
import {
	TextField,
	MetaFilterField,
	MetaFilterSuggestionGroup
} from '@/shared/tailwind-ui';

import { FormSection } from '../components';
import { HistoryGlobalSearchFormValues } from '../global-search-form.types';
import { useParameterSuggestions } from '../global-search-form.suggestions.hooks';
import { HISTORY_FIELD_BADGE_CLASS } from '../global-search-form.constants';

export type TestSectionProps = {
	onResetTestSectionClick: () => void;
	onResetTestSectionDefaultClick: () => void;
};

const PARAMETER_HELP_EXAMPLES = [
	'time_limit=30 & !ipv6',
	'argument1!=5 & argument2>=10',
	'(pkt_size>1500 | jumbo) & proto=udp'
];

export const TestSection = (props: TestSectionProps) => {
	const portalRef = useRef<HTMLDivElement>(null);
	const { control, watch } = useFormContext<HistoryGlobalSearchFormValues>();
	const parameterSuggestions = useParameterSuggestions(watch('testName'));
	const parameterGroups = useMemo<MetaFilterSuggestionGroup[]>(
		() =>
			parameterSuggestions.suggestions.length
				? [
						{
							label: 'Parameters',
							items: parameterSuggestions.suggestions,
							className: HISTORY_FIELD_BADGE_CLASS.parameters
						}
				  ]
				: [],
		[parameterSuggestions.suggestions]
	);

	return (
		<FormSection className="flex flex-col">
			<FormSection.Bar className="bg-bg-ok" />
			<FormSection.Header name="Test">
				<FormSection.ResetToDefaultButton
					helpMessage="Reset test section to defaults"
					onClick={props.onResetTestSectionDefaultClick}
				/>
				<FormSection.ResetButton
					helpMessage="Clear test section"
					onClick={props.onResetTestSectionClick}
				/>
			</FormSection.Header>
			<div className="flex flex-col gap-4">
				<div className="grid gap-4 md:grid-cols-2" ref={portalRef}>
					<TestPathComboboxField
						name="testName"
						label="Test Path"
						placeholder="default_buff"
						control={control}
						container={portalRef}
					/>
					<TextField
						name="hash"
						label="Hash"
						type="text"
						placeholder="3c447d65a665c0eee17a0a20827e9"
						control={control}
					/>
				</div>
				<MetaFilterField
					control={control}
					valuesName="parameters"
					expressionName="testArgExpr"
					variant="form"
					label="Parameters"
					name="parameters"
					placeholder="time_limit:30"
					suggestions={parameterGroups}
					suggestionsLoading={parameterSuggestions.isLoading}
					allowCustomValues={false}
					onSuggestionsRequest={parameterSuggestions.request}
					chipClassName={() => HISTORY_FIELD_BADGE_CLASS.parameters}
					helpNoun="parameter"
					helpExamples={PARAMETER_HELP_EXAMPLES}
					keyValueDisplayDelimiter={config.keyValueDisplayDelimiter}
					keyValueSubmitDelimiter={config.keyValueSubmitDelimiter}
				/>
			</div>
		</FormSection>
	);
};
