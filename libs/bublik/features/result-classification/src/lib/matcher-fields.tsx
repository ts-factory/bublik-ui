/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
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
	Tooltip,
	type BadgeItem
} from '@/shared/tailwind-ui';
import { config } from '@/bublik/config';
import { formatKeyValueForDisplay } from '@/shared/utils';

/**
 * The rule matcher, as three chip fields.
 *
 * Every criterion is exact — no operators, no regex — and an **empty one is
 * ignored**, which is what makes a rule's match scope implicit rather than a
 * set of flags. The hints below are the ones `MatcherDetail` already shows on
 * an expanded row; a form that asks for these values should explain them in the
 * same words the table does.
 *
 * Values are held as `BadgeItem[]` because that is what `BadgeInput` speaks.
 * `parametersToRecord` and friends convert at the edges — see `rule-form`.
 */

export const MATCHER_HINTS = {
	parameters: 'The result must carry all of these, matched exactly.',
	verdicts: 'The result must carry all of these verdicts.',
	tags: 'Run-level gate — a run missing any of these is skipped entirely.'
} as const;

function badgeItems(values: string[]): BadgeItem[] {
	return values.map((value) => ({ id: value, value }));
}

/** `{env: 'ci'}` -> `['env=ci']`, in the delimiter the rest of the app submits. */
export function parametersToItems(
	parameters: Record<string, string> | null | undefined
): BadgeItem[] {
	return badgeItems(
		Object.entries(parameters ?? {}).map(
			([key, value]) => `${key}${config.keyValueSubmitDelimiter}${value}`
		)
	);
}

export function listToItems(values: string[] | null | undefined): BadgeItem[] {
	return badgeItems(values ?? []);
}

/**
 * The inverse. A chip without a delimiter has no value to match on, so it is
 * dropped rather than sent as `{'foo': ''}` — which would be a criterion the
 * user did not write and that almost nothing satisfies.
 */
export function itemsToParameters(
	items: BadgeItem[] | undefined
): Record<string, string> {
	const parameters: Record<string, string> = {};

	(items ?? []).forEach((item) => {
		const separator = item.value.indexOf(config.keyValueSubmitDelimiter);

		if (separator <= 0) return;

		const key = item.value.slice(0, separator).trim();
		const value = item.value
			.slice(separator + config.keyValueSubmitDelimiter.length)
			.trim();

		if (key) parameters[key] = value;
	});

	return parameters;
}

export function itemsToList(items: BadgeItem[] | undefined): string[] {
	return (items ?? []).map((item) => item.value.trim()).filter(Boolean);
}

interface MatcherFieldProps<T extends FieldValues> {
	control: Control<T>;
	name: Path<T>;
	label: string;
	hint: string;
	placeholder: string;
	/** Chips are `key=value`; renders them with the display delimiter. */
	keyValue?: boolean;
	testId: string;
}

export function MatcherField<T extends FieldValues>({
	control,
	name,
	label,
	hint,
	placeholder,
	keyValue = false,
	testId
}: MatcherFieldProps<T>) {
	return (
		<div className="flex flex-col gap-1" data-testid={testId}>
			<Controller
				control={control}
				name={name}
				render={({ field }) => (
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
				)}
			/>
			<p className="text-xs text-text-menu">{hint}</p>
		</div>
	);
}

export interface MatcherReadOnlyProps {
	parameters: Record<string, string> | null | undefined;
	verdicts: string[] | null | undefined;
	tags: string[] | null | undefined;
}

/**
 * The same three criteria, for a rule that can no longer change them.
 *
 * Deliberately the colours `MatcherDetail` uses on an expanded row, which are
 * in turn the run page's: a parameter looks like a parameter whether you are
 * reading a result, the rule that matched it, or the form that cannot edit it.
 */
export function MatcherReadOnly({
	parameters,
	verdicts,
	tags
}: MatcherReadOnlyProps) {
	const sections: {
		label: string;
		hint: string;
		values: string[];
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
		<div className="flex flex-col gap-3" data-testid="rule-matcher-readonly">
			{sections.map((section) => (
				<div key={section.label} className="flex flex-col gap-1">
					<Tooltip content={section.hint}>
						<span className="w-fit text-[0.6875rem] font-bold tracking-wider uppercase text-text-menu">
							{section.label}
						</span>
					</Tooltip>
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
					) : (
						<span className="text-xs text-text-menu">
							Not constrained — this criterion is ignored
						</span>
					)}
				</div>
			))}
		</div>
	);
}

function displayKeyValue(value: string): string {
	return formatKeyValueForDisplay(value, {
		displayDelimiter: config.keyValueDisplayDelimiter,
		submitDelimiter: config.keyValueSubmitDelimiter
	});
}
