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

	it('names categories as the form and the badges do, not by their API slug', () => {
		const legendItems = getLegendItems({
			categories: 'product-defect;known-issue'
		});
		const categories = legendItems.find((item) => item.label === 'Categories');

		expect(categories?.value).toEqual(['Defect', 'Known']);
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

	it('shows the issue badge when given one, and the bare id until then', () => {
		const issue = (content?: string) =>
			getLegendItems({ issue: '3' }, { issue: content }).find(
				(item) => item.label === 'Issue'
			);

		expect(issue()?.value).toBe('#3');
		expect(issue()?.content).toBeUndefined();
		expect(issue('badge')?.content).toBe('badge');
	});

	it('lists the substring search, which lives outside the search form', () => {
		const substring = (query: HistoryAPIQuery) =>
			getLegendItems(query).find((item) => item.label === 'Substring Filter');

		expect(substring({ search: 'timeout' })?.value).toBe('timeout');
		expect(substring({ search: '  ' })).toBeUndefined();
		expect(substring({})).toBeUndefined();
	});
});
