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
 * set of flags. `MATCHER_HINTS` says so in the read-only panel's tooltips; the
 * editable fields carry no prose of their own.
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
	placeholder: string;
	/** Chips are `key=value`; renders them with the display delimiter. */
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
		// A two-column grid rather than three stacked label-over-values blocks.
		// Stacked, each criterion cost two lines even when it had nothing in it,
		// and the labels sat at a different left edge from the chips beside them.
		// `items-baseline` puts a label on the same line as the first row of its
		// chips instead of floating above them.
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
						) : (
							<span className="text-xs text-text-menu">Not constrained</span>
						)}
					</dd>
				</Fragment>
			))}
		</dl>
	);
}

function displayKeyValue(value: string): string {
	return formatKeyValueForDisplay(value, {
		displayDelimiter: config.keyValueDisplayDelimiter,
		submitDelimiter: config.keyValueSubmitDelimiter
	});
}
