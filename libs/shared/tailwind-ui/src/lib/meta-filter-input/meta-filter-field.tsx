/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useMemo } from 'react';
import { Control, FieldValues, Path, useController } from 'react-hook-form';

import { joinExpressions, splitExpressions } from './expression';
import { MetaFilterInput, MetaFilterInputProps } from './meta-filter-input';
import { MetaFilterChip } from './types';
import { BadgeItem } from '../badge-input';

const NO_BADGES: BadgeItem[] = [];

type MetaFilterFieldProps<T extends FieldValues> = Omit<
	MetaFilterInputProps,
	'chips' | 'onChipsChange' | 'onClear'
> & {
	control: Control<T, unknown>;
	/** The form field holding the value chips, a `BadgeItem[]`. */
	valuesName: Path<T>;
	/** The form field holding the expression, one string, chips joined with `&`. */
	expressionName: Path<T>;
};

/**
 * A meta filter input bound to two react-hook-form fields: the value chips
 * stay the badge list the form already submits, and the expression chips are
 * joined into the one expression string the form already submits, so nothing
 * downstream of the form changes. On the way back the expression is split on
 * its top-level `&`, so chips survive a reload.
 */
function MetaFilterField<T extends FieldValues>({
	control,
	valuesName,
	expressionName,
	...inputProps
}: MetaFilterFieldProps<T>) {
	const { field: values } = useController<T>({ name: valuesName, control });
	const { field: expression } = useController<T>({
		name: expressionName,
		control
	});

	const badges: BadgeItem[] = values.value ?? NO_BADGES;
	const expressionText: string = expression.value ?? '';

	const chips = useMemo<MetaFilterChip[]>(
		() => [
			...badges.map((badge) => ({
				id: `value:${badge.id}`,
				value: badge.value,
				isExpression: false
			})),
			...splitExpressions(expressionText).map((text, index) => ({
				id: `expression:${index}:${text}`,
				value: text,
				isExpression: true
			}))
		],
		[badges, expressionText]
	);

	const handleChipsChange = (next: MetaFilterChip[]) => {
		const nextBadges: BadgeItem[] = next
			.filter((chip) => !chip.isExpression)
			.map((chip) => {
				const existing = badges.find(
					(badge) => `value:${badge.id}` === chip.id
				);
				return (
					existing ?? { id: chip.id.replace(/^value:/, ''), value: chip.value }
				);
			});
		const nextExpression = joinExpressions(
			next.filter((chip) => chip.isExpression).map((chip) => chip.value)
		);

		values.onChange(nextBadges);
		expression.onChange(nextExpression);
	};

	return (
		<MetaFilterInput
			{...inputProps}
			ref={values.ref}
			chips={chips}
			onChipsChange={handleChipsChange}
		/>
	);
}

export { MetaFilterField };
export type { MetaFilterFieldProps };
