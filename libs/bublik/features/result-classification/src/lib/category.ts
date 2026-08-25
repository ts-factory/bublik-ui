/* SPDX-License-Identifier: Apache-2.0 */
import type { IssueCategory } from '@/shared/types';

export const CATEGORY_OPTIONS: {
	value: IssueCategory;
	displayValue: string;
}[] = [
	{ value: 'product-defect', displayValue: 'Product defect' },
	{ value: 'test-bug', displayValue: 'Test/automation bug' },
	{ value: 'env', displayValue: 'Environment / infra' },
	{ value: 'known-issue', displayValue: 'Known issue' },
	{ value: 'flaky', displayValue: 'Flaky / intermittent' },
	{ value: 'to-investigate', displayValue: 'To investigate' }
];
