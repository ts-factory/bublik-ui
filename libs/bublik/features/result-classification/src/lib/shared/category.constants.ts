/* SPDX-License-Identifier: Apache-2.0 */
import type { IssueCategory } from '@/shared/types';

import type { Disposition } from '../classification/classification.types';

/**
 * The disposition a new rule starts with for its category. The server has its
 * own default, but only for a request that leaves `expected` out, and the forms
 * always send it, so this is the default the user actually gets. It differs
 * from the server's on `to-investigate`: nobody has decided anything yet, so it
 * marks rather than calls the result a regression.
 */
export function defaultDispositionFor(category: IssueCategory): Disposition {
	switch (category) {
		case 'known-issue':
		case 'env':
		case 'test-bug':
		case 'flaky':
			return 'expected';
		case 'product-defect':
			return 'unexpected';
		case 'to-investigate':
			return 'none';
	}
}
