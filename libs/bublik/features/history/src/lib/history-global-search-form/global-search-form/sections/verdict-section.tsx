/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useFormContext } from 'react-hook-form';

import { VERDICT_TYPE } from '@/shared/types';
import { RadioField, BadgeField, TextField } from '@/shared/tailwind-ui';

import { FormSectionHeader } from '../components';
import { HistoryGlobalSearchFormValues } from '../global-search-form.types';

export const VerdictSection = () => {
	const { control, watch } = useFormContext<HistoryGlobalSearchFormValues>();

	const verdictLookup = watch('verdictLookup');

	return (
		<fieldset>
			<FormSectionHeader name="Verdict" />
			<div className="mb-6 grid grid-cols-4 gap-4">
				<div className="span-1">
					<RadioField
						name="verdictLookup"
						value={VERDICT_TYPE.String}
						label="String"
						control={control}
					/>
				</div>
				<div className="span-1">
					<RadioField
						name="verdictLookup"
						value={VERDICT_TYPE.Regex}
						label="Regex"
						control={control}
					/>
				</div>
				<div className="span-1">
					<RadioField
						name="verdictLookup"
						value={VERDICT_TYPE.None}
						label="None"
						control={control}
					/>
				</div>
			</div>
			<div className="flex flex-col gap-4">
				<BadgeField
					label="String verdict"
					name="verdict"
					placeholder={
						verdictLookup === VERDICT_TYPE.String
							? 'Unexpectedly failed with errno ENOPROTOOPT'
							: verdictLookup === VERDICT_TYPE.Regex
							? '.\\*'
							: ''
					}
					disabled={watch('verdictLookup') === VERDICT_TYPE.None}
					control={control}
				/>
				<TextField
					name={'verdictExpr'}
					label="Verdict expressions"
					placeholder={'None | "Verdict"'}
					control={control}
				/>
			</div>
		</fieldset>
	);
};
