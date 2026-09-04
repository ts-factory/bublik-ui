/* SPDX-License-Identifier: Apache-2.0 */
import type { IssueCategory } from '@/shared/types';

import {
	CATEGORY_META,
	CATEGORY_ORDER
} from '../classification/classification.constants';

export const CATEGORY_OPTIONS: {
	value: IssueCategory;
	displayValue: string;
}[] = CATEGORY_ORDER.map((value) => ({
	value,
	displayValue: CATEGORY_META[value].displayValue
}));

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
