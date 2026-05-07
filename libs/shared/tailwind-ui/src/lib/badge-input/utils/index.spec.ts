/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import { formatBadgeString, parseBadgeString } from './index';

describe('badge input utils', () => {
	describe('parseBadgeString', () => {
		it('splits comma-separated values', () => {
			expect(parseBadgeString('first, second')).toEqual(['first', 'second']);
		});

		it('preserves commas inside quoted values', () => {
			expect(parseBadgeString('"failed, errno", timeout')).toEqual([
				'failed, errno',
				'timeout'
			]);
		});

		it('unescapes doubled quotes inside quoted values', () => {
			expect(parseBadgeString('"failed ""hard"", errno"')).toEqual([
				'failed "hard", errno'
			]);
		});

		it('keeps the existing delimiter conversion', () => {
			expect(parseBadgeString('time_limit:30, "failed, errno"')).toEqual([
				'time_limit=30',
				'failed, errno'
			]);
		});
	});

	describe('formatBadgeString', () => {
		it('joins values with comma and space', () => {
			expect(formatBadgeString(['first', 'second'])).toBe('first, second');
		});

		it('quotes values containing commas', () => {
			expect(formatBadgeString(['failed, errno', 'timeout'])).toBe(
				'"failed, errno", timeout'
			);
		});

		it('escapes quotes inside quoted values', () => {
			expect(formatBadgeString(['failed "hard", errno'])).toBe(
				'"failed ""hard"", errno"'
			);
		});

		it('preserves values through a format and parse round trip', () => {
			const values = [' plain ', 'failed, errno', 'failed "hard"', 'timeout'];

			expect(parseBadgeString(formatBadgeString(values))).toEqual(values);
		});
	});
});
