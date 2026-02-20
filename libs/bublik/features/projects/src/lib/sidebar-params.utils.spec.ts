/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { parsePath } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { SIDEBAR_PREFIX } from '@/shared/types';

import {
	mergeParamsWithSidebarState,
	mergeStringUrlWithSidebarState
} from './sidebar-params.utils';

const SIDEBAR_KEY = `${SIDEBAR_PREFIX}.runs.lastMode`;

describe('mergeParamsWithSidebarState', () => {
	it('preserves sidebar params and rewrites project params', () => {
		const targetParams = new URLSearchParams('mode=charts&project=1');
		const currentParams = new URLSearchParams(`project=2&${SIDEBAR_KEY}=list`);

		const result = mergeParamsWithSidebarState(targetParams, currentParams, [
			42
		]);

		expect(result.get('mode')).toBe('charts');
		expect(result.get(SIDEBAR_KEY)).toBe('list');
		expect(result.getAll('project')).toEqual(['42']);
	});
});

describe('mergeStringUrlWithSidebarState', () => {
	const currentParams = new URLSearchParams(`project=2&${SIDEBAR_KEY}=list`);

	it('preserves hash when target already has query params', () => {
		const result = mergeStringUrlWithSidebarState(
			'/runs?mode=charts#details',
			currentParams,
			[42]
		);
		const parsed = parsePath(result);
		const search = new URLSearchParams(parsed.search || '');

		expect(parsed.pathname).toBe('/runs');
		expect(parsed.hash).toBe('#details');
		expect(search.get('mode')).toBe('charts');
		expect(search.get(SIDEBAR_KEY)).toBe('list');
		expect(search.getAll('project')).toEqual(['42']);
	});

	it('preserves hash when target has no query params', () => {
		const result = mergeStringUrlWithSidebarState(
			'/runs#details',
			currentParams,
			[42]
		);
		const parsed = parsePath(result);
		const search = new URLSearchParams(parsed.search || '');

		expect(parsed.pathname).toBe('/runs');
		expect(parsed.hash).toBe('#details');
		expect(search.get(SIDEBAR_KEY)).toBe('list');
		expect(search.getAll('project')).toEqual(['42']);
	});

	it('handles relative paths without moving hash into query', () => {
		const result = mergeStringUrlWithSidebarState(
			'../runs?mode=charts#details',
			currentParams,
			[42]
		);
		const parsed = parsePath(result);
		const search = new URLSearchParams(parsed.search || '');

		expect(parsed.pathname).toBe('../runs');
		expect(parsed.hash).toBe('#details');
		expect(search.get('mode')).toBe('charts');
		expect(search.get(SIDEBAR_KEY)).toBe('list');
		expect(search.getAll('project')).toEqual(['42']);
	});
});
