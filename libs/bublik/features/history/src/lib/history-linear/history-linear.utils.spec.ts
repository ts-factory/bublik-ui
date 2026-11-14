/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import { RESULT_TYPE, type HistoryDataLinear } from '@/shared/types';

import { matchesLinearGlobalFilter } from './history-linear.utils';
import type { HistoryLinearGlobalFilter } from './history-linear.types';

const NO_FILTER: HistoryLinearGlobalFilter = {
	tags: [],
	verdicts: [],
	parameters: [],
	resultType: null,
	isNotExpected: null
};

function row(overrides: Partial<HistoryDataLinear> = {}): HistoryDataLinear {
	return {
		start_date: '2026-10-01T10:00:00Z',
		finish_date: '2026-10-01T10:01:00Z',
		duration: '00:01:00',
		obtained_result: { result_type: RESULT_TYPE.Failed, verdicts: ['boom'] },
		expected_results: [{ result_type: RESULT_TYPE.Passed, verdicts: [] }],
		relevant_tags: ['linux'],
		metadata: [],
		parameters: ['mtu=1500'],
		has_error: true,
		has_measurements: false,
		run_id: 7,
		project_id: 3,
		project_name: 'alpha',
		result_id: 4242,
		iteration_id: 11,
		important_tags: [],
		issues: [],
		...overrides
	};
}

describe('matchesLinearGlobalFilter', () => {
	it('lets every row through an empty filter', () => {
		expect(matchesLinearGlobalFilter(row(), NO_FILTER)).toBe(true);
	});

	it('wants every picked badge among the row’s', () => {
		expect(
			matchesLinearGlobalFilter(row(), {
				...NO_FILTER,
				tags: ['linux'],
				parameters: ['mtu=1500'],
				verdicts: ['boom']
			})
		).toBe(true);
		expect(
			matchesLinearGlobalFilter(row(), { ...NO_FILTER, tags: ['windows'] })
		).toBe(false);
	});

	it('wants the picked obtained result, expected or not', () => {
		const failed = {
			...NO_FILTER,
			resultType: RESULT_TYPE.Failed,
			isNotExpected: true
		};

		expect(matchesLinearGlobalFilter(row(), failed)).toBe(true);
		expect(matchesLinearGlobalFilter(row({ has_error: false }), failed)).toBe(
			false
		);
	});
});
