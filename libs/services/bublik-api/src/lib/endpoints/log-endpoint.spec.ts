/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import type { BaseQueryApi } from '@reduxjs/toolkit/query';
import { describe, expect } from 'vitest';

import type { GetLogJsonInputs, RootBlock } from '@/shared/types';

import {
	constructJsonUrl,
	fixPagesCountForAllView,
	normalizeLogJsonInput
} from './log-endpoints';

const createLogBlocks = (curPage: number, pagesCount: number): RootBlock => ({
	version: 'v1',
	root: [
		{
			type: 'te-log',
			pagination: { cur_page: curPage, pages_count: pagesCount },
			content: []
		}
	]
});

const createApi = (
	queries: Record<string, { originalArgs?: GetLogJsonInputs; data?: RootBlock }>
): BaseQueryApi =>
	({
		getState: () => ({ bublikApi: { queries } })
	} as unknown as BaseQueryApi);

describe('constructJsonUrl', () => {
	test('it constructs the correct URL without page', () => {
		const inputWithoutPage = { id: '1' };
		const result = constructJsonUrl(inputWithoutPage);
		const expectedUrl = '/api/v2/logs/1/json/';
		expect(result).toBe(expectedUrl);
	});
	test('it constructs the correct URL with page', () => {
		const inputWithPage = { id: '1', page: 2 };
		const result = constructJsonUrl(inputWithPage);
		const expectedUrl = '/api/v2/logs/1/json/?page=2';
		expect(result).toBe(expectedUrl);
	});

	test('it constructs the same URL for null and omitted page', () => {
		const resultWithNullPage = constructJsonUrl({ id: '1', page: null });
		const resultWithoutPage = constructJsonUrl({ id: '1' });

		expect(resultWithNullPage).toBe(resultWithoutPage);
	});

	test('it constructs the all-pages URL for numeric page zero', () => {
		expect(constructJsonUrl({ id: '1', page: 0 })).toBe(
			'/api/v2/logs/1/json/?page=0'
		);
	});
});

describe('normalizeLogJsonInput', () => {
	test('it removes null page from log json query args', () => {
		expect(normalizeLogJsonInput({ id: '1', page: null })).toEqual({ id: '1' });
	});

	test('it preserves actual page values', () => {
		expect(normalizeLogJsonInput({ id: '1', page: 2 })).toEqual({
			id: '1',
			page: 2
		});
	});
});

describe('fixPagesCountForAllView', () => {
	test('uses the cached canonical first page count', () => {
		const allPages = createLogBlocks(0, 0);
		const api = createApi({
			'getLogJson({"id":"1"})': {
				originalArgs: { id: '1' },
				data: createLogBlocks(1, 12)
			}
		});

		const result = fixPagesCountForAllView(allPages, 1, api);

		expect(result.root[0].pagination?.pages_count).toBe(12);
		expect(allPages.root[0].pagination?.pages_count).toBe(0);
	});

	test('does not use another all-pages cache entry', () => {
		const allPages = createLogBlocks(0, 0);
		const api = createApi({
			'getLogJson({"id":"1","page":"0"})': {
				originalArgs: { id: '1', page: '0' },
				data: createLogBlocks(0, 12)
			}
		});

		const result = fixPagesCountForAllView(allPages, 1, api);

		expect(result.root[0].pagination?.pages_count).toBe(0);
	});
});
