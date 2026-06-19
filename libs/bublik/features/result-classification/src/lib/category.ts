/* SPDX-License-Identifier: Apache-2.0 */
import type { IssueCategory } from '@/shared/types';

export const CATEGORY_OPTIONS: { value: IssueCategory; displayValue: string }[] =
	[
		{ value: 'product-defect', displayValue: 'Product defect' },
		{ value: 'test-bug', displayValue: 'Test/automation bug' },
		{ value: 'env', displayValue: 'Environment / infra' },
		{ value: 'known-issue', displayValue: 'Known issue' },
		{ value: 'flaky', displayValue: 'Flaky / intermittent' },
		{ value: 'to-investigate', displayValue: 'To investigate' }
	];

const EXPECTED_BY_CATEGORY: Record<IssueCategory, boolean> = {
	'known-issue': true,
	env: true,
	'test-bug': true,
	flaky: true,
	'product-defect': false,
	'to-investigate': false
};

export function defaultExpectedFor(category: IssueCategory): boolean {
	return EXPECTED_BY_CATEGORY[category];
}

/** Badge variant for a category's expected disposition. */
export function categoryBadgeVariant(
	expected: boolean
): 'expected' | 'unexpected' {
	return expected ? 'expected' : 'unexpected';
}
