/* SPDX-License-Identifier: Apache-2.0 */
import type { IssueCategory } from '@/shared/types';

import { CATEGORY_META, CATEGORY_ORDER } from './classification-colors';

/** Select options for the classify form; labels live in `CATEGORY_META`. */
export const CATEGORY_OPTIONS: {
	value: IssueCategory;
	displayValue: string;
}[] = CATEGORY_ORDER.map((value) => ({
	value,
	displayValue: CATEGORY_META[value].displayValue
}));
