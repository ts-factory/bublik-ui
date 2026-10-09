/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import { filterBadgeSuggestions } from './suggestions';

const PARAMETERS = [
	'buf_size=1024',
	'env=VAR.iut_only',
	'time_limit=30',
	'time_limit=60',
	'limit_mode=soft'
];

describe('filterBadgeSuggestions', () => {
	it('offers every suggestion for an empty input', () => {
		expect(filterBadgeSuggestions(PARAMETERS, '  ')).toEqual({
			items: PARAMETERS,
			total: PARAMETERS.length
		});
	});

	it('matches anywhere, case-insensitively, prefix matches first', () => {
		expect(filterBadgeSuggestions(PARAMETERS, 'LIMIT').items).toEqual([
			'limit_mode=soft',
			'time_limit=30',
			'time_limit=60'
		]);
	});

	it('matches the displayed form of a value as well as the submitted one', () => {
		expect(filterBadgeSuggestions(PARAMETERS, 'time_limit: 6').items).toEqual([
			'time_limit=60'
		]);
		expect(filterBadgeSuggestions(PARAMETERS, 'time_limit=3').items).toEqual([
			'time_limit=30'
		]);
	});

	it('offers a value once', () => {
		expect(
			filterBadgeSuggestions(
				['time_limit=30', 'time_limit=30', 'time_limit=60'],
				'time'
			).items
		).toEqual(['time_limit=30', 'time_limit=60']);
	});

	it('offers nothing for an expression or a value not in the list', () => {
		expect(filterBadgeSuggestions(PARAMETERS, '!env & buf').items).toEqual([]);
	});

	it('caps the list and counts the rest', () => {
		const many = Array.from({ length: 150 }, (_, index) => `tag${index}`);

		expect(filterBadgeSuggestions(many, 'tag', { limit: 20 })).toEqual({
			items: many.slice(0, 20),
			total: 150
		});
	});
});
