/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import { defaultDispositionFor } from './category.constants';

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
