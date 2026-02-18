/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { VERDICT_TYPE } from '@/shared/types';
import { BadgeField, TextField, cn } from '@/shared/tailwind-ui';

import {
	ExpressionToggleButton,
	FieldResetButton,
	FormSection
} from '../components';
import { HistoryGlobalSearchFormValues } from '../global-search-form.types';

export type VerdictSectionProps = {
	onResetVerdictSectionClick: () => void;
};

export const VerdictSection = (props: VerdictSectionProps) => {
	const { control, watch, setValue } =
		useFormContext<HistoryGlobalSearchFormValues>();
	const [isVerdictExpressionVisible, setIsVerdictExpressionVisible] = useState(
		() => Boolean(watch('verdictExpr'))
	);

	const verdictLookup = watch('verdictLookup');

	const setVerdictLookup = (lookup: VERDICT_TYPE) => {
		setValue('verdictLookup', lookup, {
			shouldDirty: true,
			shouldTouch: true
		});
	};

	const lookupToggleClassName = (lookup: VERDICT_TYPE) =>
		cn(
			'rounded px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.02em] leading-[0.75rem] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20',
			verdictLookup === lookup
				? 'bg-primary-wash text-primary'
				: 'text-text-menu hover:bg-primary-wash hover:text-primary'
		);

	const lookupOptions = [
		{
			lookup: VERDICT_TYPE.String,
			label: 'String',
			helpLabel: 'Lookup as string'
		},
		{
			lookup: VERDICT_TYPE.Regex,
			label: 'Regex',
			helpLabel: 'Lookup as regex'
		},
		{
			lookup: VERDICT_TYPE.None,
			label: 'None',
			helpLabel: 'Disable verdict lookup'
		}
	] as const;

	const lookupButtons = (
		<div
			className="inline-flex items-center gap-0.5 rounded border border-border-primary bg-white p-0.5"
			role="radiogroup"
			aria-label="Verdict lookup type"
		>
			{lookupOptions.map((option) => (
				<button
					key={option.lookup}
					type="button"
					role="radio"
					aria-checked={verdictLookup === option.lookup}
					aria-label={option.helpLabel}
					onClick={(event) => {
						event.stopPropagation();
						setVerdictLookup(option.lookup);
					}}
					className={lookupToggleClassName(option.lookup)}
				>
					{option.label}
				</button>
			))}
		</div>
	);

	const lookupControls = (
		<div className="inline-flex items-center gap-1">
			{lookupButtons}
			<FieldResetButton
				helpMessage="Clear verdict filters"
				onClick={(event) => {
					event.stopPropagation();
					props.onResetVerdictSectionClick();
				}}
			/>
		</div>
	);

	return (
		<FormSection>
			<FormSection.Bar className="bg-bg-interrupted" />
			<FormSection.Header name="Verdict" />
			<div className="flex flex-col gap-4">
				<div className="flex gap-2">
					<div className="flex-1">
						<BadgeField
							label="String Verdict"
							name="verdict"
							placeholder={
								verdictLookup === VERDICT_TYPE.String
									? 'Unexpectedly failed with errno ENOPROTOOPT'
									: verdictLookup === VERDICT_TYPE.Regex
									? '.\\*'
									: ''
							}
							disabled={verdictLookup === VERDICT_TYPE.None}
							control={control}
							labelTrailingContent={lookupControls}
						/>
					</div>
					<ExpressionToggleButton
						label="verdict expression"
						isOpen={isVerdictExpressionVisible}
						onClick={() =>
							setIsVerdictExpressionVisible((previous) => !previous)
						}
					/>
				</div>
				{isVerdictExpressionVisible ? (
					<TextField
						name={'verdictExpr'}
						label="Verdict Expression"
						placeholder={'None | "Verdict"'}
						control={control}
					/>
				) : null}
			</div>
		</FormSection>
	);
};
