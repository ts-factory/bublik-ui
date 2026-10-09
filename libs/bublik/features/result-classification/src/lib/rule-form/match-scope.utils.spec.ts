/* SPDX-License-Identifier: Apache-2.0 */
import { describe, expect, it } from 'vitest';

import {
	PRESETS,
	chipsForFlags,
	chipsForRule,
	matcherForFlags,
	presetForFlags
} from './match-scope.utils';

describe('match-scope.utils', () => {
	it('round-trips every preset', () => {
		for (const preset of PRESETS) {
			expect(presetForFlags(preset.flags)).toBe(preset.label);
		}
	});

	it('returns Custom for a non-preset combo', () => {
		expect(
			presetForFlags({
				matchParameters: false,
				matchVerdicts: false,
				matchTags: true
			})
		).toBe('Custom');
	});

	it('lists Path plus active dimensions as chips', () => {
		expect(
			chipsForFlags({
				matchParameters: true,
				matchVerdicts: true,
				matchTags: true
			})
		).toEqual(['Path', 'Params', 'Verdicts', 'Tags']);
		expect(
			chipsForFlags({
				matchParameters: false,
				matchVerdicts: false,
				matchTags: false
			})
		).toEqual(['Path']);
	});
});

describe('matcherForFlags', () => {
	// The endpoint reads each key with a default drawn from the result, so an
	// absent key captures and an empty one ignores. All three on is exactly the
	// server's default, which is why it sends nothing at all.
	it('sends no matcher when every dimension is on', () => {
		expect(
			matcherForFlags({
				matchParameters: true,
				matchVerdicts: true,
				matchTags: true
			})
		).toBeUndefined();
	});

	it('sends an empty value for each dimension that is off', () => {
		expect(
			matcherForFlags({
				matchParameters: false,
				matchVerdicts: false,
				matchTags: false
			})
		).toEqual({ parameters: {}, verdicts: [], tags: [] });
	});

	it('names only the dimensions being turned off', () => {
		expect(
			matcherForFlags({
				matchParameters: true,
				matchVerdicts: false,
				matchTags: true
			})
		).toEqual({ verdicts: [] });
	});
});

describe('chipsForRule', () => {
	it('an unconstrained rule matches on path alone', () => {
		expect(chipsForRule({ parameters: {}, verdicts: [], tags: [] })).toEqual([
			'Path'
		]);
	});

	it('treats missing criteria as empty', () => {
		expect(chipsForRule({})).toEqual(['Path']);
		expect(
			chipsForRule({ parameters: null, verdicts: null, tags: null })
		).toEqual(['Path']);
	});

	it('names each non-empty criterion, widest gate last', () => {
		expect(
			chipsForRule({ parameters: { env: 'ci' }, verdicts: [], tags: [] })
		).toEqual(['Path', 'Params']);
		expect(
			chipsForRule({ parameters: {}, verdicts: ['timeout'], tags: [] })
		).toEqual(['Path', 'Verdicts']);
		expect(
			chipsForRule({ parameters: {}, verdicts: [], tags: ['x=1'] })
		).toEqual(['Path', 'Tags']);
	});

	it('a fully constrained rule names all four', () => {
		expect(
			chipsForRule({
				parameters: { env: 'ci' },
				verdicts: ['timeout'],
				tags: ['x=1']
			})
		).toEqual(['Path', 'Params', 'Verdicts', 'Tags']);
	});
});
