/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { searchQueryToBackendQuery } from './history-slice.utils';

describe('searchQueryToBackendQuery', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-07-24T12:00:00'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('defaults to the latest three calendar months', () => {
		const query = searchQueryToBackendQuery({ testName: 'suite/test' });

		expect(query.fromDate).toBe('2026-04-24');
		expect(query.toDate).toBe('2026-07-24');
	});

	it('preserves an explicitly selected date range', () => {
		const query = searchQueryToBackendQuery({
			testName: 'suite/test',
			startDate: '2025-01-01',
			finishDate: '2025-01-31'
		});

		expect(query.fromDate).toBe('2025-01-01');
		expect(query.toDate).toBe('2025-01-31');
	});

	it('derives a missing start date from an explicit finish date', () => {
		const query = searchQueryToBackendQuery({
			testName: 'suite/test',
			finishDate: '2025-01-31'
		});

		expect(query.fromDate).toBe('2024-10-31');
		expect(query.toDate).toBe('2025-01-31');
	});
});
