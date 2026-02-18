/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { TextField, BadgeField } from '@/shared/tailwind-ui';

import {
	ExpressionToggleButton,
	FieldResetButton,
	FormSection
} from '../components';
import { HistoryGlobalSearchFormValues } from '../global-search-form.types';

export type TestSectionProps = {
	onResetTestSectionClick: () => void;
	onResetTestSectionDefaultClick: () => void;
};

export const TestSection = (props: TestSectionProps) => {
	const { control, watch, setValue } =
		useFormContext<HistoryGlobalSearchFormValues>();
	const [isParametersExpressionVisible, setIsParametersExpressionVisible] =
		useState(() => Boolean(watch('testArgExpr')));

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
				<div className="grid gap-4 md:grid-cols-2">
					<TextField
						name="testName"
						label="Test Path"
						type="text"
						placeholder="default_buff"
						showEndOnMount
						control={control}
					/>
					<TextField
						name="hash"
						label="Hash"
						type="text"
						placeholder="3c447d65a665c0eee17a0a20827e9"
						control={control}
					/>
				</div>
				<div className="flex gap-2">
					<div className="flex-1">
						<BadgeField
							name="parameters"
							label="Parameters"
							placeholder="time_limit:30"
							control={control}
							labelTrailingContent={
								<FieldResetButton
									helpMessage="Clear parameters"
									onClick={(event) => {
										event.stopPropagation();
										setValue('parameters', [], {
											shouldDirty: true,
											shouldTouch: true
										});
									}}
								/>
							}
						/>
					</div>
					<ExpressionToggleButton
						label="parameter expression"
						isOpen={isParametersExpressionVisible}
						onClick={() =>
							setIsParametersExpressionVisible((previous) => !previous)
						}
					/>
				</div>
				{isParametersExpressionVisible ? (
					<TextField
						name={'testArgExpr'}
						label="Parameter Expression"
						placeholder={'argument1 != 5 & argument2 >= 10'}
						control={control}
					/>
				) : null}
			</div>
		</FormSection>
	);
};
