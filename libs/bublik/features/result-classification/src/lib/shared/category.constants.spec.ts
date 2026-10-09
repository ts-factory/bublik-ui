/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import {
	defaultDispositionFor,
	defaultDispositionForCategories
} from './category.constants';

describe('defaultDispositionFor', () => {
	it('suppresses for the four causes that are not the product', () => {
		expect(defaultDispositionFor('known-issue')).toBe('expected');
		expect(defaultDispositionFor('env')).toBe('expected');
		expect(defaultDispositionFor('test-bug')).toBe('expected');
		expect(defaultDispositionFor('flaky')).toBe('expected');
	});

	it('keeps a product defect counting as unexpected', () => {
		expect(defaultDispositionFor('product-defect')).toBe('unexpected');
	});

	it('leaves a result still to investigate undecided', () => {
		expect(defaultDispositionFor('to-investigate')).toBe('none');
	});
});

describe('defaultDispositionForCategories', () => {
	it("takes the single category's own default", () => {
		expect(defaultDispositionForCategories(['known-issue'])).toBe('expected');
		expect(defaultDispositionForCategories(['to-investigate'])).toBe('none');
	});

	it('stays undecided while anything is still to investigate', () => {
		expect(
			defaultDispositionForCategories(['known-issue', 'to-investigate'])
		).toBe('none');
		expect(
			defaultDispositionForCategories(['product-defect', 'to-investigate'])
		).toBe('none');
	});

	it('keeps counting when a product defect is among the causes', () => {
		expect(defaultDispositionForCategories(['flaky', 'product-defect'])).toBe(
			'unexpected'
		);
	});

	it('suppresses only when every cause is explained', () => {
		expect(defaultDispositionForCategories(['env', 'flaky', 'test-bug'])).toBe(
			'expected'
		);
	});

	it('decides nothing for an empty selection', () => {
		expect(defaultDispositionForCategories([])).toBeUndefined();
	});
});
