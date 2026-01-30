/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { describe, expect } from 'vitest';
import { constructJsonUrl } from './log-endpoints';
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
});
