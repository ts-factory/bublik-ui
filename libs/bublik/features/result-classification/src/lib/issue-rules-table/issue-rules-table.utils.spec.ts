/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import {
	normalizeVerdictsKey,
	parseVerdictsKey,
	ruleVerdictsKey,
	VERDICTS_IGNORED_TEXT,
	verdictsKeyLabel
} from './issue-rules-table.utils';

describe('ruleVerdictsKey', () => {
	it('spells a list as JSON, in order, without spaces', () => {
		expect(ruleVerdictsKey(['Timeout', 'Packet lost'])).toBe(
			'["Timeout","Packet lost"]'
		);
	});

	it('tells the rules without verdicts from those ignoring them', () => {
		expect(ruleVerdictsKey([])).toBe('[]');
		expect(ruleVerdictsKey(null)).toBe('null');
		expect(ruleVerdictsKey(undefined)).toBe('null');
	});
});

describe('parseVerdictsKey', () => {
	it('reads the list back, whatever spacing the JSON used', () => {
		expect(parseVerdictsKey('["Timeout", "Packet lost"]')).toEqual([
			'Timeout',
			'Packet lost'
		]);
		expect(parseVerdictsKey('[]')).toEqual([]);
		expect(parseVerdictsKey('null')).toBeNull();
	});

	it('takes a bare verdict, as older URLs carried them, for the list of it', () => {
		expect(parseVerdictsKey('Segmentation fault')).toEqual([
			'Segmentation fault'
		]);
		// JSON, but not a list of strings: a verdict that happens to be a number.
		expect(parseVerdictsKey('42')).toEqual(['42']);
		expect(parseVerdictsKey('[1]')).toEqual(['[1]']);
	});
});

describe('normalizeVerdictsKey', () => {
	it('brings the server spelling and an old URL value to the chips', () => {
		expect(normalizeVerdictsKey('["a", "b"]')).toBe('["a","b"]');
		expect(normalizeVerdictsKey('a')).toBe('["a"]');
		expect(normalizeVerdictsKey('null')).toBe('null');
	});
});

describe('verdictsKeyLabel', () => {
	it('names the verdicts, or what the chips say for none', () => {
		expect(verdictsKeyLabel('["a","b"]')).toBe('a, b');
		expect(verdictsKeyLabel('[]')).toBe('No verdicts');
		expect(verdictsKeyLabel('null')).toBe(VERDICTS_IGNORED_TEXT);
	});
});
