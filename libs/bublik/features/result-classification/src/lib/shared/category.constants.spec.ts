/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import { CATEGORY_OPTIONS, defaultExpectedFor } from './category.constants';

describe('category', () => {
	it('has six options', () => {
		expect(CATEGORY_OPTIONS).toHaveLength(6);
	});
});

describe('defaultExpectedFor', () => {
	it('suppresses for the four causes that are not the product', () => {
		expect(defaultExpectedFor('known-issue')).toBe(true);
		expect(defaultExpectedFor('env')).toBe(true);
		expect(defaultExpectedFor('test-bug')).toBe(true);
		expect(defaultExpectedFor('flaky')).toBe(true);
	});

	it('leaves the two that still need answering as unexpected', () => {
		expect(defaultExpectedFor('product-defect')).toBe(false);
		expect(defaultExpectedFor('to-investigate')).toBe(false);
	});
});
