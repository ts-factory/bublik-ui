/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

import { describe, expect, it } from 'vitest';

import { hasPersistedRunTableState } from './run-table.hooks';

describe('hasPersistedRunTableState', () => {
	it('returns true when run table params exist', () => {
		expect(hasPersistedRunTableState('?expanded=%7B%22a%22%3Atrue%7D')).toBe(
			true
		);
		expect(hasPersistedRunTableState('?globalFilter=%5B%5D')).toBe(true);
		expect(hasPersistedRunTableState('?rowState=%7B%7D')).toBe(true);
		expect(hasPersistedRunTableState('?columnFilters=%7B%7D')).toBe(true);
	});

	it('returns false when only sidebar params exist', () => {
		expect(
			hasPersistedRunTableState(
				'?global.run.lastMode=details&global.run.lastDetails=%2Fruns%2F538%3Fexpanded%253D%257B%257D'
			)
		).toBe(false);
	});

	it('returns false when run table params are missing', () => {
		expect(hasPersistedRunTableState('')).toBe(false);
		expect(hasPersistedRunTableState('?foo=bar')).toBe(false);
	});
});
