/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import { RunDataResults } from '@/shared/types';

import {
	MatrixIteration,
	classifyParams,
	parseParams,
	summarizeCell
} from './matrix-analysis';

function iteration(
	params: Record<string, string>,
	resultType = 'PASSED',
	hasError = false
): MatrixIteration {
	return {
		resultId: 1,
		params,
		resultType,
		hasError,
		hasMeasurements: false,
		source: {} as RunDataResults
	};
}

describe('parseParams', () => {
	it('splits on the first "=" only', () => {
		expect(parseParams(['a=1', 'b=x=y', 'flag'])).toEqual({
			a: '1',
			b: 'x=y',
			flag: ''
		});
	});
});

describe('classifyParams', () => {
	it('separates varying from fixed params and sorts values naturally', () => {
		const cls = classifyParams([
			iteration({ n: '10', env: 'x' }),
			iteration({ n: '9', env: 'x' }),
			iteration({ n: '100', env: 'x' })
		]);

		expect(cls.varying).toEqual(['n']);
		expect(cls.fixed).toEqual([{ name: 'env', value: 'x' }]);
		expect(cls.values.n).toEqual(['9', '10', '100']);
	});
});

describe('summarizeCell', () => {
	it('shows the result initial for a single iteration', () => {
		const summary = summarizeCell([iteration({}, 'FAILED', true)]);

		expect(summary.label).toBe('F');
		expect(summary.unexpected).toBe(1);
		expect(summary.title).toBe('FAILED · unexpected');
	});

	it('shows unexpected / total for a mixed cell', () => {
		const summary = summarizeCell([
			iteration({}, 'PASSED'),
			iteration({}, 'FAILED', true),
			iteration({}, 'SKIPPED')
		]);

		expect(summary.label).toBe('1/3');
		expect(summary.expected).toBe(2);
		expect(summary.unexpected).toBe(1);
		expect(summary.title).toBe('3 iterations · 2 expected · 1 unexpected');
	});

	it('shows only the count for a uniform cell', () => {
		const summary = summarizeCell([
			iteration({}, 'FAILED', true),
			iteration({}, 'FAILED', true)
		]);

		expect(summary.label).toBe('2');
		expect(summary.unexpected).toBe(2);
	});
});
