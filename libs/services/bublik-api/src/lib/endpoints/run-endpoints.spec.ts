/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import { RESULT_TYPE } from '@/shared/types';

import { toResultsFilterParam } from './run-endpoints';

const EVERY_FILTERABLE_STATUS = [
	RESULT_TYPE.Passed,
	RESULT_TYPE.Failed,
	RESULT_TYPE.Killed,
	RESULT_TYPE.Cored,
	RESULT_TYPE.Incomplete,
	RESULT_TYPE.Skipped,
	RESULT_TYPE.Faked,
	RESULT_TYPE.Empty
];

describe('toResultsFilterParam', () => {
	it('keeps a narrow status filter as it is', () => {
		expect(
			toResultsFilterParam([
				RESULT_TYPE.Failed,
				RESULT_TYPE.Killed,
				RESULT_TYPE.Cored
			])
		).toBe('FAILED;KILLED;CORED');
	});

	it('drops UNSPEC, which the endpoint rejects by name', () => {
		expect(
			toResultsFilterParam([RESULT_TYPE.Skipped, RESULT_TYPE.Unspec])
		).toBe('SKIPPED');
	});

	it('sends no filter when every nameable status is asked for', () => {
		expect(toResultsFilterParam(EVERY_FILTERABLE_STATUS)).toBe('');
	});

	// The totals ask for UNSPEC too, and so do the run URLs shared before this
	// was fixed; an unfiltered request is what brings those results back.
	it('sends no filter when UNSPEC is asked for alongside them', () => {
		expect(
			toResultsFilterParam([...EVERY_FILTERABLE_STATUS, RESULT_TYPE.Unspec])
		).toBe('');
	});

	it('sends no filter when nothing is asked for', () => {
		expect(toResultsFilterParam([])).toBe('');
	});
});
