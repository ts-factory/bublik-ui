/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { ReactNode } from 'react';

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
