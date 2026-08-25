import { describe, expect, it } from 'vitest';

import { CATEGORY_OPTIONS } from './category';

describe('category', () => {
	it('has six options', () => {
		expect(CATEGORY_OPTIONS).toHaveLength(6);
	});
});
