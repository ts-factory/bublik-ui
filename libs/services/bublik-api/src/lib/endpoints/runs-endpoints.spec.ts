/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import { RunsAPIResponse } from '@/shared/types';

import {
	RUNS_PROGRESS_PAGE_SIZE,
	getRunsProgressNextPageParam
} from './runs-endpoints';

const response = (next: string | null): RunsAPIResponse => ({
	pagination: { count: 100, next, previous: null },
	results: []
});

describe('runs progress pagination', () => {
	it('loads runs in batches of 50', () => {
		expect(RUNS_PROGRESS_PAGE_SIZE).toBe(50);
	});

	it('advances while the API provides a next page', () => {
		expect(getRunsProgressNextPageParam(response('/runs?page=2'), 1)).toBe(2);
	});

	it('stops when the API has no next page', () => {
		expect(getRunsProgressNextPageParam(response(null), 2)).toBeUndefined();
	});
});
