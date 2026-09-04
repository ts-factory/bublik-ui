/* SPDX-License-Identifier: Apache-2.0 */
import type { IssueCategory } from '@/shared/types';

import { CATEGORY_META, CATEGORY_ORDER } from '../classification/classification.utils';

/** Select options for the classify form; labels live in `CATEGORY_META`. */
export const CATEGORY_OPTIONS: {
	value: IssueCategory;
	displayValue: string;
}[] = CATEGORY_ORDER.map((value) => ({
	value,
	displayValue: CATEGORY_META[value].displayValue
}));

/**
 * Mirrors the backend's `_EXPECTED_BY_CATEGORY` (`bublik/data/models/issue.py`),
 * which `default_expected_for` applies on create when the payload omits
 * `expected`.
 *
 * The rule form prefills from this rather than letting the server decide,
 * because a disposition that appears only after the request has landed is a
 * disposition nobody agreed to — and this is the field that decides whether
 * failures stop counting.
 */
export function defaultExpectedFor(category: IssueCategory): boolean {
	switch (category) {
		case 'known-issue':
		case 'env':
		case 'test-bug':
		case 'flaky':
			return true;
		case 'product-defect':
		case 'to-investigate':
			return false;
	}
}
