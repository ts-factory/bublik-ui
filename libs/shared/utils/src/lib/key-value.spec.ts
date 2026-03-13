/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

import { describe, expect, it } from 'vitest';

import {
	formatKeyValueForDisplay,
	getKeyValueParts,
	joinKeyValue,
	normalizeKeyValueForSubmit
} from './key-value';

describe('key-value utils', () => {
	it('formats submit key/value pair for display', () => {
		expect(formatKeyValueForDisplay('time_limit=30')).toBe('time_limit: 30');
	});

	it('does not modify plain values without submit delimiter', () => {
		expect(formatKeyValueForDisplay('linux-mm-612')).toBe('linux-mm-612');
	});

	it('splits only by first submit delimiter', () => {
		expect(getKeyValueParts('foo=bar=baz')).toEqual(['foo', 'bar=baz']);
	});

	it('normalizes display key/value input to submit delimiter', () => {
		expect(normalizeKeyValueForSubmit('time_limit:30')).toBe('time_limit=30');
		expect(normalizeKeyValueForSubmit('time_limit: 30')).toBe('time_limit=30');
	});

	it('does not normalize urls with ://', () => {
		expect(normalizeKeyValueForSubmit('https://example.com')).toBe(
			'https://example.com'
		);
	});

	it('joins optional key/value preserving empty parts', () => {
		expect(joinKeyValue('name', 'value')).toBe('name=value');
		expect(joinKeyValue('name', undefined)).toBe('name');
		expect(joinKeyValue(undefined, 'value')).toBe('value');
	});
});
