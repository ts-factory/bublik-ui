/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useFormContext } from 'react-hook-form';

import { TextField, BadgeField } from '@/shared/tailwind-ui';

import { HistoryGlobalSearchFormValues } from '../global-search-form.types';
import { FormSection } from '../components/form-section';

export type TestSectionProps = {
	onResetTestSectionResetClick: () => void;
};

export const TestSection = (props: TestSectionProps) => {
	const { control } = useFormContext<HistoryGlobalSearchFormValues>();

	return (
		<FormSection
			label="Test"
			onResetClick={props.onResetTestSectionResetClick}
			resetTooltipMessage="Reset test section"
		>
			<div className="flex flex-col gap-4">
				<div className="flex items-center gap-4">
					<div className="flex-1">
						<TextField
							name="testName"
							label="Test name"
							type="text"
							placeholder="default_buff"
							control={control}
						/>
					</div>
					<div className="flex-1">
						<TextField
							name="hash"
							label="Hash"
							type="text"
							placeholder="3c447d65a665c0eee17a0a20827e9"
							control={control}
						/>
					</div>
				</div>
				<BadgeField
					name="parameters"
					label="Parameters"
					placeholder="time_limit:30"
					control={control}
				/>
				<TextField
					name={'testArgExpr'}
					label="Parameter Expression"
					placeholder={'argument1 != 5 & argument2 >= 10'}
					control={control}
				/>
			</div>
		</FormSection>
	);
};
