/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { ReactNode } from 'react';

import { Badge, type BadgeVariants, cn } from '@/shared/tailwind-ui';

import type { FacetOption } from '../classification-table/classification-table.utils';

/**
 * Facet options shown as the badges their column's cells show — DEFECT, not
 * "Product defect (17)". The count goes to the end of the row in the list and
 * stays out of the trigger, where the badge alone names the filter. The label
 * is kept for search, so the filter still finds a value by its words.
 */
export function withFacetBadges<V extends string>(
	options: FacetOption[],
	badgeFor: (value: V) => ReactNode
): FacetOption[] {
	return options.map((option) => ({
		...option,
		render: badgeFor(option.value as V),
		detail: `(${option.count})`
	}));
}

/**
 * A highlighted row in the filter's list inks its text primary, and a badge
 * with no colour of its own would take it. The coloured variants carry
 * theirs; the plain chips are told to keep the body colour.
 */
const FACET_CHIP_CLASS = 'text-text-primary';

export interface MatcherFacetBadgesArgs {
	/** The chip's text for a value, when it is shown differently than it is filtered. */
	labelFor?: (value: string) => string;
	variant?: BadgeVariants;
	className?: string;
}

/**
 * `withFacetBadges` for an open-vocabulary dimension — tags, verdicts,
 * parameters — whose cells draw each value as a plain chip: the option is that
 * same chip, so the filter reads in the vocabulary of what it filters, as the
 * run's result table does for its verdicts and parameters.
 */
export function withMatcherFacetBadges(
	options: FacetOption[],
	{ labelFor = (value) => value, variant, className }: MatcherFacetBadgesArgs
): FacetOption[] {
	return withFacetBadges(options, (value: string) => (
		<Badge variant={variant} className={cn(className, FACET_CHIP_CLASS)}>
			{labelFor(value)}
		</Badge>
	));
}
