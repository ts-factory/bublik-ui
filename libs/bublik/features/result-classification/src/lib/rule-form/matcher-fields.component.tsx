/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { Fragment } from 'react';
import {
	Controller,
	type Control,
	type FieldValues,
	type Path
} from 'react-hook-form';

import {
	Badge,
	BadgeInput,
	BadgeVariants,
	ErrorMessage,
	Tooltip,
	type BadgeItem
} from '@/shared/tailwind-ui';
import { config } from '@/bublik/config';
import {
	MATCHER_HINTS,
	NO_VERDICTS_TEXT,
	displayKeyValue
} from './matcher-fields.utils';

interface MatcherFieldProps<T extends FieldValues> {
	control: Control<T>;
	name: Path<T>;
	label: string;
	placeholder: string;
	keyValue?: boolean;
	testId: string;
}

export function MatcherField<T extends FieldValues>({
	control,
	name,
	label,
	placeholder,
	keyValue = false,
	testId
}: MatcherFieldProps<T>) {
	return (
		<div data-testid={testId}>
			<Controller
				control={control}
				name={name}
				render={({ field, fieldState }) => (
					<>
						<BadgeInput
							label={label}
							placeholder={placeholder}
							badges={field.value as BadgeItem[]}
							onBadgesChange={field.onChange}
							name={field.name}
							{...(keyValue
								? {
										keyValueSubmitDelimiter: config.keyValueSubmitDelimiter,
										keyValueDisplayDelimiter: config.keyValueDisplayDelimiter
								  }
								: null)}
						/>
						{/* The server's word on the values: a tag no run of the
						    project carries, a parameter or verdict none of the test's
						    results has, which it refuses rather than store a rule
						    that matches nothing. */}
						{fieldState.error?.message ? (
							<ErrorMessage>{fieldState.error.message}</ErrorMessage>
						) : null}
					</>
				)}
			/>
		</div>
	);
}

export interface MatcherReadOnlyProps {
	parameters: Record<string, string> | null | undefined;
	verdicts: string[] | null | undefined;
	tags: string[] | null | undefined;
}

export function MatcherReadOnly({
	parameters,
	verdicts,
	tags
}: MatcherReadOnlyProps) {
	const sections: {
		label: string;
		hint: string;
		values: string[];
		/** What stands for the values when there are none; else "Not constrained". */
		none?: string;
		variant?: BadgeVariants;
		className?: string;
	}[] = [
		{
			label: 'Tags',
			hint: MATCHER_HINTS.tags,
			values: (tags ?? []).map(displayKeyValue),
			className: 'bg-badge-0'
		},
		{
			label: 'Verdicts',
			hint: MATCHER_HINTS.verdicts,
			values: verdicts ?? [],
			// `[]` is a criterion of its own: only a failure without a verdict.
			none: verdicts ? NO_VERDICTS_TEXT : undefined,
			variant: BadgeVariants.Transparent
		},
		{
			label: 'Parameters',
			hint: MATCHER_HINTS.parameters,
			values: Object.entries(parameters ?? {}).map(([key, value]) =>
				displayKeyValue(`${key}${config.keyValueSubmitDelimiter}${value}`)
			),
			className: 'bg-badge-1'
		}
	];

	return (
		<dl
			className="grid grid-cols-[max-content_minmax(0,1fr)] items-baseline gap-x-3 gap-y-1.5"
			data-testid="rule-matcher-readonly"
		>
			{sections.map((section) => (
				<Fragment key={section.label}>
					<Tooltip content={section.hint}>
						<dt className="w-fit text-[0.6875rem] font-bold tracking-wider uppercase text-text-menu">
							{section.label}
						</dt>
					</Tooltip>
					<dd className="min-w-0">
						{section.values.length ? (
							<div className="flex flex-wrap gap-1">
								{section.values.map((value) => (
									<Badge
										key={value}
										variant={section.variant}
										overflowWrap
										className={section.className}
									>
										{value}
									</Badge>
								))}
							</div>
						) : section.none ? (
							<Badge variant={section.variant} className={section.className}>
								{section.none}
							</Badge>
						) : (
							<span className="text-xs text-text-menu pl-2">
								Not constrained
							</span>
						)}
					</dd>
				</Fragment>
			))}
		</dl>
	);
}
