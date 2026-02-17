/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

import { describe, expect, it } from 'vitest';

import { HistoryAPIQuery, VERDICT_TYPE } from '@/shared/types';

import { getLegendItems } from './history-filter-legend.container.utils';

describe('getLegendItems', () => {
	it('filters out legend items with empty values', () => {
		const query: HistoryAPIQuery = {
			testName: '   ',
			hash: 'abc123',
			branches: '  ;   ',
			verdictLookup: VERDICT_TYPE.None,
			verdict: '  '
		};

		const legendItems = getLegendItems(query);

		expect(legendItems.some((item) => item.label === 'Test Name')).toBe(false);
		expect(legendItems.some((item) => item.label === 'Branches')).toBe(false);
		expect(legendItems.some((item) => item.label === 'Verdict Value')).toBe(
			false
		);
		expect(legendItems.some((item) => item.label === 'Hash')).toBe(true);
		expect(legendItems.some((item) => item.label === 'Date')).toBe(true);
	});

	it('keeps non-empty array values and removes empty array entries', () => {
		const query: HistoryAPIQuery = {
			branches: 'main; ;dev;  '
		};

		const legendItems = getLegendItems(query);
		const branchesItem = legendItems.find((item) => item.label === 'Branches');

		expect(branchesItem).toBeDefined();
		expect(Array.isArray(branchesItem?.value)).toBe(true);
		expect(branchesItem?.value).toEqual(['main', 'dev']);
	});
});
