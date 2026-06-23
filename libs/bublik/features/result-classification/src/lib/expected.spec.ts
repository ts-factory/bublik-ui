/* SPDX-License-Identifier: Apache-2.0 */
import { describe, expect, it } from 'vitest';

import { expectedBadge } from './expected';

describe('expectedBadge', () => {
	it('maps true to expected', () => {
		expect(expectedBadge(true)).toEqual({ variant: 'expected', label: 'Expected' });
	});
	it('maps false to unexpected', () => {
		expect(expectedBadge(false)).toEqual({
			variant: 'unexpected',
			label: 'Unexpected'
		});
	});
	it('maps null/undefined to none (transparent)', () => {
		expect(expectedBadge(null)).toEqual({ variant: 'transparent', label: 'None' });
		expect(expectedBadge(undefined)).toEqual({
			variant: 'transparent',
			label: 'None'
		});
	});
});
