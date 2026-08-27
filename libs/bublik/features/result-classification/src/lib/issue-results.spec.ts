/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import { issueResultRunId, issueResultTestPath } from './issue-results';

const row = (over: Partial<Parameters<typeof issueResultTestPath>[0]> = {}) => ({
	result_id: 1,
	name: 'test_name',
	path: ['pkg', 'subpkg'],
	obtained_result: 'FAILED',
	verdicts: [],
	...over
});

describe('issueResultTestPath', () => {
	// The whole point: `getHistorySearch` passes this straight through as the
	// `testName` query param, and history rejects a package path.
	it('appends the test name to the package chain', () => {
		expect(issueResultTestPath(row())).toBe('pkg/subpkg/test_name');
	});

	it('handles a test sitting at the root', () => {
		expect(issueResultTestPath(row({ path: [] }))).toBe('test_name');
	});

	it('drops a missing name rather than emitting a trailing slash', () => {
		expect(issueResultTestPath(row({ name: null }))).toBe('pkg/subpkg');
	});

	it('is empty when there is nothing to name', () => {
		expect(issueResultTestPath(row({ path: [], name: null }))).toBe('');
	});
});

describe('issueResultRunId', () => {
	it('prefers the scope it was rendered in', () => {
		expect(issueResultRunId(7243, row({ run_id: 11 }))).toBe(7243);
	});

	it('falls back to the row when there is no run scope', () => {
		expect(issueResultRunId(undefined, row({ run_id: 11 }))).toBe(11);
	});

	it('is undefined when neither knows the run', () => {
		expect(issueResultRunId(undefined, row())).toBeUndefined();
	});
});
