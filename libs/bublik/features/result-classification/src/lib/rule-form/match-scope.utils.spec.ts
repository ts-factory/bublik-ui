/* SPDX-License-Identifier: Apache-2.0 */
import { describe, expect, it } from 'vitest';

import {
	PRESETS,
	applyMutualExclusion,
	chipsForFlags,
	chipsForRule,
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
				matchImportantTags: true,
				matchAllTags: true
			})
		).toBe('Custom');
	});

	it('lists Path plus active dimensions as chips', () => {
		expect(
			chipsForFlags({
				matchParameters: true,
				matchVerdicts: true,
				matchImportantTags: true,
				matchAllTags: false
			})
		).toEqual(['Path', 'Params', 'Verdicts', 'Important tags']);
		expect(
			chipsForFlags({
				matchParameters: false,
				matchVerdicts: false,
				matchImportantTags: false,
				matchAllTags: false
			})
		).toEqual(['Path']);
	});

	it('mutual exclusion: checking all-tags unchecks important-tags', () => {
		const next = applyMutualExclusion(
			{
				matchParameters: true,
				matchVerdicts: true,
				matchImportantTags: true,
				matchAllTags: true
			},
			'matchAllTags'
		);
		expect(next.matchAllTags).toBe(true);
		expect(next.matchImportantTags).toBe(false);
	});

	it('mutual exclusion: checking important-tags unchecks all-tags', () => {
		const next = applyMutualExclusion(
			{
				matchParameters: false,
				matchVerdicts: false,
				matchImportantTags: true,
				matchAllTags: true
			},
			'matchImportantTags'
		);
		expect(next.matchImportantTags).toBe(true);
		expect(next.matchAllTags).toBe(false);
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
