/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import { RESULT_PROPERTIES } from '@/shared/types';

import {
	ObtainedResultFilterSchema,
	obtainedResultFilterCount
} from './constants';

describe('ObtainedResultFilterSchema', () => {
	it('defaults every axis, so a fresh filter reads without guards', () => {
		expect(ObtainedResultFilterSchema.parse(undefined)).toEqual({
			results: [],
			resultProperties: [],
			verdicts: [],
			categories: [],
			classifications: []
		});
	});

	it('fills in classifications for a link written before the axis existed', () => {
		const parsed = ObtainedResultFilterSchema.parse({
			verdicts: ['TIMEOUT'],
			categories: ['product-defect']
		});

		expect(parsed.classifications).toEqual([]);
		expect(parsed.verdicts).toEqual(['TIMEOUT']);
	});

	it('still reads the legacy single-result shape', () => {
		const parsed = ObtainedResultFilterSchema.parse({
			verdicts: [],
			isNotExpected: true,
			result: 'FAILED'
		});

		expect(parsed.results).toEqual(['FAILED']);
		expect(parsed.resultProperties).toEqual([RESULT_PROPERTIES.Unexpected]);
		expect(parsed.classifications).toEqual([]);
	});

	it('keeps an unknown classification out rather than failing the whole filter', () => {
		// A shared URL naming a value that has since been renamed should narrow
		// to nothing, not drop every other filter beside it.
		const parsed = ObtainedResultFilterSchema.parse({
			verdicts: ['TIMEOUT'],
			classifications: ['a-value-that-no-longer-exists']
		});

		expect(parsed.verdicts).toEqual(['TIMEOUT']);
		expect(parsed.classifications).toEqual(['a-value-that-no-longer-exists']);
	});
});

describe('obtainedResultFilterCount', () => {
	it('counts the classifications axis', () => {
		// The regression this guards: three places ask this question -- the
		// analytics event, the toolbar's has-filters test, and the writer that
		// deletes the entry once the last value is cleared. An axis missing here
		// is a filter that cannot be reset.
		const filter = ObtainedResultFilterSchema.parse({
			classifications: ['untriaged', 'no-effect']
		});

		expect(obtainedResultFilterCount(filter)).toBe(2);
	});

	it('sums every axis at once', () => {
		const filter = ObtainedResultFilterSchema.parse({
			results: ['FAILED'],
			resultProperties: [RESULT_PROPERTIES.Unexpected],
			verdicts: ['TIMEOUT'],
			categories: ['product-defect'],
			classifications: ['untriaged']
		});

		expect(obtainedResultFilterCount(filter)).toBe(5);
	});

	it('is zero for an untouched filter, so Reset stays dark', () => {
		expect(
			obtainedResultFilterCount(ObtainedResultFilterSchema.parse(undefined))
		).toBe(0);
	});
});
