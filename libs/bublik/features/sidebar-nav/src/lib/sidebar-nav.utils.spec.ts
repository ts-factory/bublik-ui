/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import { toString } from './sidebar-nav.utils';

describe('toString', () => {
	it('returns string values unchanged', () => {
		expect(toString('/runs?mode=charts#section')).toBe(
			'/runs?mode=charts#section'
		);
	});

	it('normalizes object search/hash values without separators', () => {
		expect(
			toString({ pathname: '/runs', search: 'mode=charts', hash: 'section' })
		).toBe('/runs?mode=charts#section');
	});

	it('does not add duplicate separators for object paths', () => {
		expect(
			toString({ pathname: '/runs', search: '?mode=charts', hash: '#section' })
		).toBe('/runs?mode=charts#section');
	});
});
