/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useFormContext } from 'react-hook-form';

import {
	TextField,
	BadgeField,
	AriaDateRangeField,
	CheckboxField
} from '@/shared/tailwind-ui';
import { RUN_PROPERTIES } from '@/shared/types';

import { FormSectionHeader, IconButton } from '../components';
import { HistoryGlobalSearchFormValues } from '../global-search-form.types';

export type RunSectionProps = {
	onResetRunSectionClick: () => void;
};

export const RunSection = (props: RunSectionProps) => {
	const { control, formState, getFieldState } =
		useFormContext<HistoryGlobalSearchFormValues>();

	const runPropsError = (
		formState.errors.runProperties && getFieldState('runProperties').isTouched
			? formState.errors.runProperties.message
			: undefined
	) as string | undefined;

	return (
		<fieldset>
			<FormSectionHeader name="Run" error={runPropsError}>
				<IconButton
					name="Bin"
					size={18}
					helpMessage="Reset run section"
					onClick={props.onResetRunSectionClick}
				/>
			</FormSectionHeader>
			<div className="flex flex-col gap-4">
				<div className={'w-1/2'}>
					<AriaDateRangeField label="Dates" name="dates" control={control} />
				</div>
				<TextField
					name="labelExpr"
					label="Label expressions"
					placeholder={'label1 & label2'}
					control={control}
				/>
				<BadgeField
					name="branches"
					label="Branches"
					placeholder="master"
					control={control}
				/>
				<TextField
					name={'branchExpr'}
					label="Branch Expression"
					placeholder="branch1 | branch2"
					control={control}
				/>
				<BadgeField
					name="revisions"
					label="Revisions"
					placeholder="8af383125f20cc5ecdb8393bf"
					control={control}
				/>
				<TextField
					name={'revisionExpr'}
					label="Revision Expression"
					placeholder="meta_name1 & meta_name2=32"
					control={control}
				/>
				<BadgeField
					label="Tags"
					name="runData"
					placeholder="medford"
					control={control}
				/>
				<TextField
					name="tagExpr"
					label="Tag Expression"
					placeholder="pci-15b3 | pci-sub-15b3"
					control={control}
				/>
			</div>
			<div className="mt-4 grid grid-cols-4 gap-4">
				<div className="span-1">
					<CheckboxField
						iconName="InformationCircleForbidden"
						iconSize={16}
						name="runProperties"
						value={RUN_PROPERTIES.Compromised}
						label="Compromised"
						control={control}
					/>
				</div>
				<div className="span-1">
					<CheckboxField
						iconName="InformationCircleCheckmark"
						iconSize={16}
						name="runProperties"
						value={RUN_PROPERTIES.NotCompromised}
						label="Not compromised"
						control={control}
					/>
				</div>
			</div>
		</fieldset>
	);
};
