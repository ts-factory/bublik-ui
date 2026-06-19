import { describe, expect, it } from 'vitest';

import { CATEGORY_OPTIONS, defaultExpectedFor } from './category';

describe('category', () => {
	it('has six options', () => {
		expect(CATEGORY_OPTIONS).toHaveLength(6);
	});
	it('defaults expected per category', () => {
		expect(defaultExpectedFor('known-issue')).toBe(true);
		expect(defaultExpectedFor('product-defect')).toBe(false);
	});
});
