/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useFormContext } from 'react-hook-form';

import {
	TextField,
	BadgeField,
	AriaDateRangeField,
	CheckboxField,
	Separator
} from '@/shared/tailwind-ui';
import { RUN_PROPERTIES } from '@/shared/types';

import { HistoryGlobalSearchFormValues } from '../global-search-form.types';
import { FormSection } from '../components/form-section';
import { FormSectionSubheader } from '../components';

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
		<FormSection
			label="Run"
			error={runPropsError}
			resetTooltipMessage="Reset run section"
			onResetClick={props.onResetRunSectionClick}
		>
			<div className="flex flex-col gap-4">
				<div className="px-4">
					<div className={'w-1/2'}>
						<AriaDateRangeField label="Dates" name="dates" control={control} />
					</div>
				</div>
				<Separator />
				<div className="px-4 flex flex-col gap-4">
					<FormSectionSubheader name="Branch" />
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
				</div>

				<Separator />
				<div className="px-4 flex flex-col gap-4">
					<FormSectionSubheader name="Revision" />
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
				</div>
				<Separator />
				<div className="px-4 flex flex-col gap-4">
					<FormSectionSubheader name="Label" />
					<TextField
						name={'labelExpr'}
						label="Label Expression"
						placeholder={'label1 & label2'}
						control={control}
					/>
				</div>
				<Separator />
				<div className="px-4 flex flex-col gap-4 pb-4">
					<FormSectionSubheader name="Tag" />
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
			</div>
			<Separator />
			<div className="mt-2 px-4">
				<FormSectionSubheader name="Run Properties" />
				<div className="grid grid-cols-4 gap-4">
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
			</div>
		</FormSection>
	);
};
