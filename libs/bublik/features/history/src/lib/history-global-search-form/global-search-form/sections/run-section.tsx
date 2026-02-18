/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import {
	TextField,
	BadgeField,
	AriaDateRangeField,
	CheckboxField
} from '@/shared/tailwind-ui';
import { RUN_PROPERTIES } from '@/shared/types';

import {
	ExpressionToggleButton,
	FieldResetButton,
	FormSection,
	FormSectionSubheader,
	FormError
} from '../components';
import { HistoryGlobalSearchFormValues } from '../global-search-form.types';

export type RunSectionProps = {
	onResetRunSectionClick: () => void;
	onResetRunSectionDefaultClick: () => void;
};

export const RunSection = (props: RunSectionProps) => {
	const { control, formState, watch, setValue } =
		useFormContext<HistoryGlobalSearchFormValues>();
	const [isLabelExpressionVisible, setIsLabelExpressionVisible] = useState(() =>
		Boolean(watch('labelExpr'))
	);
	const [isBranchExpressionVisible, setIsBranchExpressionVisible] = useState(
		() => Boolean(watch('branchExpr'))
	);
	const [isRevisionExpressionVisible, setIsRevisionExpressionVisible] =
		useState(() => Boolean(watch('revisionExpr')));
	const [isTagExpressionVisible, setIsTagExpressionVisible] = useState(() =>
		Boolean(watch('tagExpr'))
	);

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
					<div className="flex gap-2">
						<div className="flex-1">
							<TextField
								name="runIds"
								label="Run ID"
								placeholder="1"
								control={control}
							/>
						</div>
						<div className="size-10" />
					</div>
				</div>
				<div className="flex gap-2">
					<div className="flex-1">
						<BadgeField
							name="labels"
							label="Labels"
							placeholder="label"
							control={control}
							labelTrailingContent={
								<FieldResetButton
									helpMessage="Clear labels"
									onClick={(event) => {
										event.stopPropagation();
										setValue('labels', [], {
											shouldDirty: true,
											shouldTouch: true
										});
									}}
								/>
							}
						/>
					</div>
					<ExpressionToggleButton
						label="label expression"
						isOpen={isLabelExpressionVisible}
						onClick={() => setIsLabelExpressionVisible((previous) => !previous)}
					/>
				</div>
				{isLabelExpressionVisible ? (
					<TextField
						name="labelExpr"
						label="Label Expression"
						placeholder={'label1 & label2'}
						control={control}
					/>
				) : null}
				<div className="flex gap-2">
					<div className="flex-1">
						<BadgeField
							name="branches"
							label="Branches"
							placeholder="master"
							control={control}
							labelTrailingContent={
								<FieldResetButton
									helpMessage="Clear branches"
									onClick={(event) => {
										event.stopPropagation();
										setValue('branches', [], {
											shouldDirty: true,
											shouldTouch: true
										});
									}}
								/>
							}
						/>
					</div>
					<ExpressionToggleButton
						label="branch expression"
						isOpen={isBranchExpressionVisible}
						onClick={() =>
							setIsBranchExpressionVisible((previous) => !previous)
						}
					/>
				</div>
				{isBranchExpressionVisible ? (
					<TextField
						name={'branchExpr'}
						label="Branch Expression"
						placeholder="branch1 | branch2"
						control={control}
					/>
				) : null}
				<div className="flex gap-2">
					<div className="flex-1">
						<BadgeField
							name="revisions"
							label="Revisions"
							placeholder="8af383125f20cc5ecdb8393bf"
							control={control}
							labelTrailingContent={
								<FieldResetButton
									helpMessage="Clear revisions"
									onClick={(event) => {
										event.stopPropagation();
										setValue('revisions', [], {
											shouldDirty: true,
											shouldTouch: true
										});
									}}
								/>
							}
						/>
					</div>
					<ExpressionToggleButton
						label="revision expression"
						isOpen={isRevisionExpressionVisible}
						onClick={() =>
							setIsRevisionExpressionVisible((previous) => !previous)
						}
					/>
				</div>
				{isRevisionExpressionVisible ? (
					<TextField
						name={'revisionExpr'}
						label="Revision Expression"
						placeholder="meta_name1 & meta_name2=32"
						control={control}
					/>
				) : null}
				<div className="flex gap-2">
					<div className="flex-1">
						<BadgeField
							label="Tags"
							name="runData"
							placeholder="medford"
							control={control}
							labelTrailingContent={
								<FieldResetButton
									helpMessage="Clear tags"
									onClick={(event) => {
										event.stopPropagation();
										setValue('runData', [], {
											shouldDirty: true,
											shouldTouch: true
										});
									}}
								/>
							}
						/>
					</div>
					<ExpressionToggleButton
						label="tag expression"
						isOpen={isTagExpressionVisible}
						onClick={() => setIsTagExpressionVisible((previous) => !previous)}
					/>
				</div>
				{isTagExpressionVisible ? (
					<TextField
						name="tagExpr"
						label="Tag Expression"
						placeholder="pci-15b3 | pci-sub-15b3"
						control={control}
					/>
				) : null}
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
