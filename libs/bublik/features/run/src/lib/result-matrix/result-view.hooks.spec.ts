/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import { MatrixSuggestion, ParamClassification } from './matrix-analysis';
import {
	FACET_ALL,
	isLayoutApplied,
	resolveMatrixState
} from './result-view.hooks';

const cls: ParamClassification = {
	varying: ['a', 'b', 'c'],
	fixed: [{ name: 'env', value: 'x' }],
	values: { a: ['1', '2'], b: ['10', '20'], c: ['u', 'v'], env: ['x'] }
};

const balanced: MatrixSuggestion = {
	id: 'balanced',
	label: 'Balanced',
	rationale: '',
	score: '2×2',
	rows: ['a'],
	cols: ['b'],
	facets: ['c']
};

describe('resolveMatrixState', () => {
	it('uses the first suggestion when nothing is stored', () => {
		const state = resolveMatrixState(undefined, cls, [balanced]);

		expect(state.rows).toEqual(['a']);
		expect(state.cols).toEqual(['b']);
		expect(state.facets).toEqual(['c']);
		expect(state.mode).toBe('coverage');
		expect(state.margins).toBe(false);
		expect(state.facetSel).toEqual({
			a: FACET_ALL,
			b: FACET_ALL,
			c: FACET_ALL
		});
	});

	it('falls back to the varying params when there are no suggestions', () => {
		const state = resolveMatrixState(undefined, cls, []);

		expect(state.rows).toEqual(['a']);
		expect(state.cols).toEqual(['b']);
		expect(state.facets).toEqual(['c']);
	});

	it('keeps stored axes and drops unknown params', () => {
		const state = resolveMatrixState(
			{ rows: ['c', 'gone'], cols: ['a'], facets: [] },
			cls,
			[balanced]
		);

		expect(state.rows).toEqual(['c']);
		expect(state.cols).toEqual(['a']);
		expect(state.facets).toEqual([]);
	});

	it('falls back to defaults when stored axes leave rows or cols empty', () => {
		const state = resolveMatrixState({ rows: ['gone'], cols: ['a'] }, cls, [
			balanced
		]);

		expect(state.rows).toEqual(['a']);
		expect(state.cols).toEqual(['b']);
	});

	it('gives every parameter a single role', () => {
		const state = resolveMatrixState(
			{ rows: ['a'], cols: ['a', 'b'], facets: ['b', 'c'] },
			cls,
			[balanced]
		);

		expect(state.rows).toEqual(['a']);
		expect(state.cols).toEqual(['b']);
		expect(state.facets).toEqual(['c']);
	});

	it('only keeps facet selections that exist in the data', () => {
		const state = resolveMatrixState({ facetSel: { c: 'v', b: 'nope' } }, cls, [
			balanced
		]);

		expect(state.facetSel).toEqual({ a: FACET_ALL, b: FACET_ALL, c: 'v' });
	});

	it('keeps stored display options', () => {
		const state = resolveMatrixState(
			{
				mode: 'result',
				margins: true,
				facetMode: 'trellis'
			},
			cls,
			[balanced]
		);

		expect(state.mode).toBe('result');
		expect(state.margins).toBe(true);
		expect(state.facetMode).toBe('trellis');
	});
});

describe('isLayoutApplied', () => {
	it('matches only when rows, cols and facets are identical in order', () => {
		expect(
			isLayoutApplied({ rows: ['a'], cols: ['b'], facets: ['c'] }, balanced)
		).toBe(true);
		expect(
			isLayoutApplied({ rows: ['b'], cols: ['a'], facets: ['c'] }, balanced)
		).toBe(false);
		expect(
			isLayoutApplied({ rows: ['a'], cols: ['b'], facets: [] }, balanced)
		).toBe(false);
	});
});
