/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { describe, expect } from 'vitest';
import { constructJsonUrl, normalizeLogJsonInput } from './log-endpoints';

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
