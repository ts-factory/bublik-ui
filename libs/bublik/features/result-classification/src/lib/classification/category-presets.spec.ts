/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import { CATEGORY_ORDER } from './classification.constants';
import {
	CATEGORY_PRESETS,
	isPresetActive,
	isPresetAvailable
} from './category-presets';

describe('CATEGORY_PRESETS', () => {
	it('covers every category exactly once', () => {
		const covered = CATEGORY_PRESETS.flatMap((preset) => [
			...preset.categories
		]);

		expect([...covered].sort()).toEqual([...CATEGORY_ORDER].sort());
	});

	it('puts the actionable categories under Actionable', () => {
		const attention = CATEGORY_PRESETS.find(
			(preset) => preset.id === 'attention'
		);

		expect(attention?.label).toBe('Actionable');
		expect(attention?.categories).toEqual([
			'to-investigate',
			'product-defect',
			'test-bug'
		]);
	});
});

describe('isPresetActive', () => {
	const explained = {
		id: 'explained',
		label: 'Triaged',
		description: '',
		iconName: 'InformationCircleCheckmark',
		categories: ['env', 'flaky', 'known-issue']
	} as const;

	it('is active when the filter is exactly the preset, in any order', () => {
		expect(isPresetActive(explained, ['env', 'flaky', 'known-issue'])).toBe(
			true
		);
		expect(isPresetActive(explained, ['known-issue', 'env', 'flaky'])).toBe(
			true
		);
	});

	it('is not active on a partial, wider or empty filter', () => {
		expect(isPresetActive(explained, [])).toBe(false);
		expect(isPresetActive(explained, ['env', 'flaky'])).toBe(false);
		expect(
			isPresetActive(explained, ['env', 'flaky', 'known-issue', 'test-bug'])
		).toBe(false);
		expect(isPresetActive(explained, ['env', 'flaky', 'flaky'])).toBe(false);
	});
});

describe('isPresetAvailable', () => {
	const explained = {
		id: 'explained',
		label: 'Triaged',
		description: '',
		iconName: 'InformationCircleCheckmark',
		categories: ['env', 'flaky', 'known-issue']
	} as const;

	it('is available when any of its categories is listed', () => {
		expect(isPresetAvailable(explained, ['known-issue'])).toBe(true);
		expect(isPresetAvailable(explained, ['test-bug', 'flaky'])).toBe(true);
	});

	it('is not available when none of its categories is listed', () => {
		expect(isPresetAvailable(explained, [])).toBe(false);
		expect(isPresetAvailable(explained, ['test-bug', 'to-investigate'])).toBe(
			false
		);
	});
});
