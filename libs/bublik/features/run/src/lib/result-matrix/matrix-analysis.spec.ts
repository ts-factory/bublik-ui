/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import { RunDataResults } from '@/shared/types';

import {
	MatrixIteration,
	PARAM_NOT_SET,
	classifyParams,
	comboCount,
	facetTuples,
	parseParams,
	suggestLayouts,
	summarizeCell,
	toIterations
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

describe('toIterations', () => {
	it('gives every iteration every parameter any of them has', () => {
		const [first, second] = toIterations([
			{ result_id: 1, parameters: ['a=1', 'b=2'] },
			{ result_id: 2, parameters: ['a=1'] }
		] as RunDataResults[]);

		expect(first.params).toEqual({ a: '1', b: '2' });
		expect(second.params).toEqual({ a: '1', b: PARAM_NOT_SET });
		expect(classifyParams([first, second]).varying).toEqual(['b']);
	});
});

describe('comboCount', () => {
	it('multiplies the cardinalities', () => {
		expect(comboCount(['a', 'b'], { a: ['1', '2'], b: ['x', 'y', 'z'] })).toBe(
			6
		);
	});
});

describe('facetTuples', () => {
	const names = ['a', 'b', 'c', 'd'];
	const values = Object.fromEntries(
		names.map((name) => [name, ['1', '2', '3', '10']])
	);

	it('draws every combination while there are few', () => {
		expect(facetTuples(['a', 'b'], values, [])).toHaveLength(16);
	});

	it('draws only the observed ones, in order, when there are many', () => {
		const tuples = facetTuples(names, values, [
			iteration({ a: '10', b: '1', c: '1', d: '1' }),
			iteration({ a: '2', b: '1', c: '1', d: '1' }),
			iteration({ a: '2', b: '1', c: '1', d: '1' })
		]);

		expect(tuples).toEqual([
			['2', '1', '1', '1'],
			['10', '1', '1', '1']
		]);
	});
});

describe('suggestLayouts', () => {
	it('offers no gaps to expose on a full grid, and each layout once', () => {
		const iters = ['1', '2'].flatMap((a) =>
			['x', 'y'].map((b) => iteration({ a, b }))
		);

		const ids = suggestLayouts(iters, classifyParams(iters)).map((s) => s.id);

		expect(ids).toEqual(['balanced']);
	});

	it('exposes the gaps of a sparse grid', () => {
		// a × b is full; c follows a, so a × c has gaps.
		const iters = ['1', '2', '3'].flatMap((a) =>
			['x', 'y', 'z'].map((b) => iteration({ a, b, c: a === '1' ? 'u' : 'v' }))
		);

		const ids = suggestLayouts(iters, classifyParams(iters)).map((s) => s.id);

		expect(ids).toContain('gaps');
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
