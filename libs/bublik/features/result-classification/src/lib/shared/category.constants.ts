/* SPDX-License-Identifier: Apache-2.0 */
import type { IssueCategory } from '@/shared/types';

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
