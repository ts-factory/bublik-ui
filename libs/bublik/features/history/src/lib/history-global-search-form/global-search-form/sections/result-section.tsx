/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useFormContext } from 'react-hook-form';

import { CheckboxField } from '@/shared/tailwind-ui';
import { RESULT_PROPERTIES, RESULT_TYPE } from '@/shared/types';

import { FormSectionSubheader } from '../components';
import { HistoryGlobalSearchFormValues } from '../global-search-form.types';
import { FormSection } from '../components/form-section';

export type ResultSectionProps = {
	onResultSectionClick: () => void;
};

export const ResultSection = (props: ResultSectionProps) => {
	const { control, formState, getFieldState } =
		useFormContext<HistoryGlobalSearchFormValues>();

	const resultPropsError =
		formState.errors.resultProperties &&
		getFieldState('resultProperties').isTouched
			? formState.errors.resultProperties.message
			: undefined;

	const resultsError =
		formState.errors.results && getFieldState('results').isTouched
			? formState.errors.results.message
			: undefined;

	const resultSectionError = (resultPropsError || resultsError || undefined) as
		| string
		| undefined;

	return (
		<FormSection
			label="Result"
			error={resultSectionError}
			onResetClick={props.onResultSectionClick}
			resetTooltipMessage="Reset result section"
		>
			<div className="mb-4">
				<FormSectionSubheader name="Result type classification" />
				<div className="grid grid-cols-4 gap-4 items-center">
					<div className="span-1">
						<CheckboxField
							iconName="TriangleExclamationMark"
							iconSize={16}
							name="resultProperties"
							value={RESULT_PROPERTIES.Unexpected}
							label="Unexpected"
							control={control}
						/>
					</div>
					<div className="span-1">
						<CheckboxField
							iconName="TriangleQuestionMark"
							iconSize={16}
							name="resultProperties"
							value={RESULT_PROPERTIES.Expected}
							label="Expected"
							control={control}
						/>
					</div>
					<div className="span-1">
						<CheckboxField
							iconName="TriangleQuestionMark"
							iconSize={16}
							name="resultProperties"
							value={RESULT_PROPERTIES.NotRun}
							label="Not run"
							control={control}
						/>
					</div>
				</div>
			</div>
			<div>
				<FormSectionSubheader name="Obtained result" />
				<div className="grid-cols-4 grid gap-4">
					<CheckboxField
						iconName="BoxCheckmark"
						iconSize={16}
						name="results"
						value={RESULT_TYPE.Passed}
						label="PASSED"
						control={control}
					/>
					<CheckboxField
						iconName="BoxCrossMark"
						iconSize={16}
						name="results"
						value={RESULT_TYPE.Failed}
						label="FAILED"
						control={control}
					/>
					<CheckboxField
						iconName="BoxCrossMark"
						iconSize={16}
						name="results"
						value={RESULT_TYPE.Killed}
						label="KILLED"
						control={control}
					/>
					<CheckboxField
						iconName="BoxCrossMark"
						iconSize={16}
						name="results"
						value={RESULT_TYPE.Cored}
						label="CORED"
						control={control}
					/>
					<CheckboxField
						iconName="BoxExclamationMark"
						iconSize={16}
						name="results"
						value={RESULT_TYPE.Skipped}
						label="SKIPPED"
						control={control}
					/>
					<CheckboxField
						iconName="BoxQuestionMark"
						iconSize={16}
						name="results"
						value={RESULT_TYPE.Faked}
						label="FAKED"
						control={control}
					/>
					<CheckboxField
						iconName="BoxExclamationMark"
						iconSize={16}
						name="results"
						value={RESULT_TYPE.Incomplete}
						label="INCOMPLETE"
						control={control}
					/>
				</div>
			</div>
		</FormSection>
	);
};
