/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import {
	RESULT_TYPE,
	type HistoryDataAggregation,
	type ResultData
} from '@/shared/types';

import {
	aggregationResults,
	matchesAggregationGlobalFilter,
	verdictGroupResults
} from './history-aggregation.utils';
import type { HistoryAggregationGlobalFilter } from './history-aggregation.types';

const NO_FILTER: HistoryAggregationGlobalFilter = {
	verdicts: [],
	parameters: [],
	resultType: null,
	isNotExpected: null
};

function group(overrides: Partial<ResultData> = {}): ResultData {
	return {
		key: 'FAILED-boom',
		has_error: true,
		result_type: RESULT_TYPE.Failed,
		verdict: ['boom'],
		results_data: [
			{
				result_id: 1,
				run_id: 10,
				start_date: '2026-10-01T10:00:00Z',
				relevant_tags: [],
				important_tags: []
			},
			{
				result_id: 2,
				run_id: 20,
				start_date: '2026-10-02T10:00:00Z',
				relevant_tags: [],
				important_tags: []
			}
		],
		...overrides
	};
}

function row(groups: ResultData[]): HistoryDataAggregation {
	return {
		hash: 'abc',
		iteration_id: '1',
		parameters: ['mtu=1500'],
		results_by_verdicts: groups
	};
}

describe('verdictGroupResults', () => {
	it('gives each result of the group, of whichever run, its error', () => {
		expect(verdictGroupResults(group())).toEqual([
			{ result_id: 1, run_id: 10, has_error: true },
			{ result_id: 2, run_id: 20, has_error: true }
		]);
	});
});

describe('aggregationResults', () => {
	it('lists the results of every verdict group of every row', () => {
		const passed = group({
			has_error: false,
			result_type: RESULT_TYPE.Passed,
			results_data: [{ ...group().results_data[0], result_id: 3 }]
		});

		expect(
			aggregationResults([row([group()]), row([passed])]).map(
				(result) => result.result_id
			)
		).toEqual([1, 2, 3]);
	});
});

describe('matchesAggregationGlobalFilter', () => {
	it('lets every row through an empty filter', () => {
		expect(matchesAggregationGlobalFilter(row([group()]), NO_FILTER)).toBe(
			true
		);
	});

	it('wants every picked parameter and verdict among the row’s', () => {
		expect(
			matchesAggregationGlobalFilter(row([group()]), {
				...NO_FILTER,
				parameters: ['mtu=1500'],
				verdicts: ['boom']
			})
		).toBe(true);
		expect(
			matchesAggregationGlobalFilter(row([group()]), {
				...NO_FILTER,
				verdicts: ['other']
			})
		).toBe(false);
	});

	it('wants a group of the picked obtained result', () => {
		const filter = {
			...NO_FILTER,
			resultType: RESULT_TYPE.Passed,
			isNotExpected: false
		};

		expect(matchesAggregationGlobalFilter(row([group()]), filter)).toBe(false);
	});
});
