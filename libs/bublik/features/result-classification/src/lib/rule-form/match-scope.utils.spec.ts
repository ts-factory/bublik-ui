/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import type { ClassifyOptions, ClassifyRuleOptions } from '@/shared/types';

import {
	CLEARED_SCOPE_PICKS,
	DEFAULT_SCOPE_PICKS,
	chipsForRule,
	clearRulePicks,
	keepSharedTags,
	matchersFor,
	parameterOptions,
	parametersPicked,
	resetRulePicks,
	ruleKey,
	ruleStanding,
	rulesOf,
	rulesWritten,
	sameAsEarlier,
	setRulePick,
	tagOptions,
	tagsApart,
	tagsPicked,
	testCount,
	verdictsKept
} from './match-scope.utils';

const TAGS = {
	default: ['fixture=net-drv-ts', 'mix=warn'],
	allowed: ['fixture=net-drv-ts', 'kernel-linux', 'mix=warn', 'sfc']
};

/** One test's results in one run. */
const RULE: ClassifyRuleOptions = {
	test_id: 21,
	test_name: 'ethtool_reset_nic',
	test_path: 'net-drv-ts/basic/ethtool_reset_nic',
	run_ids: [7],
	result_ids: [8357],
	parameters: { flag: 'DEDICATED', env: 'VAR.env.peer2peer_ipv6' },
	verdicts: [['Generated unexpected result']],
	tags: TAGS
};

/** The same test in a run with another important tag. */
const RULE_HW: ClassifyRuleOptions = {
	...RULE,
	run_ids: [8],
	result_ids: [9001, 9002],
	tags: {
		default: ['fixture=net-drv-ts', 'mix=err'],
		allowed: ['fixture=net-drv-ts', 'kernel-linux', 'mix=err']
	}
};

/** Another test, whose results failed with two verdict lists and share nothing. */
const OTHER: ClassifyRuleOptions = {
	...RULE,
	test_id: 22,
	test_name: 'rx_fcs',
	test_path: 'net-drv-ts/rx_path/rx_fcs',
	result_ids: [3, 4],
	parameters: {},
	verdicts: [['Packet lost', 'Timeout'], []]
};

const ONE: ClassifyOptions = [RULE];
const RUNS: ClassifyOptions = [RULE, RULE_HW];
const MANY: ClassifyOptions = [RULE, RULE_HW, OTHER];

describe('the rules of the options', () => {
	it('tells a rule by its test and runs', () => {
		expect(ruleKey(RULE)).toBe('21:7');
		expect(ruleKey({ ...RULE, run_ids: [7, 9] })).toBe('21:7,9');
		expect(testCount(MANY)).toBe(2);
	});

	it('offers the parameters by name, in order', () => {
		expect(
			parameterOptions(RULE).map((option) => [option.value, option.label])
		).toEqual([
			['env', 'env: VAR.env.peer2peer_ipv6'],
			['flag', 'flag: DEDICATED']
		]);
	});

	it('offers the important tags first and marks them', () => {
		expect(
			tagOptions(RULE).map((option) => [option.value, option.important])
		).toEqual([
			['fixture=net-drv-ts', true],
			['mix=warn', true],
			['kernel-linux', false],
			['sfc', false]
		]);
	});
});

describe('the picks of a rule', () => {
	it('start with every parameter, the verdicts and the important tags', () => {
		expect(parametersPicked(RULE, DEFAULT_SCOPE_PICKS)).toEqual([
			'env',
			'flag'
		]);
		expect(verdictsKept(RULE, DEFAULT_SCOPE_PICKS)).toBe(true);
		expect(tagsPicked(RULE, DEFAULT_SCOPE_PICKS)).toEqual(TAGS.default);
	});

	it('change one rule and leave the others alone', () => {
		const picks = setRulePick(DEFAULT_SCOPE_PICKS, RULE, {
			parameters: ['flag'],
			tags: ['sfc', 'gone']
		});

		expect(parametersPicked(RULE, picks)).toEqual(['flag']);
		// A pick the options do not offer is dropped.
		expect(tagsPicked(RULE, picks)).toEqual(['sfc']);
		expect(verdictsKept(RULE, picks)).toBe(true);
		expect(parametersPicked(RULE_HW, picks)).toEqual(['env', 'flag']);
		expect(tagsPicked(RULE_HW, picks)).toEqual(RULE_HW.tags.default);
	});

	it('are all empty once the section was emptied, a rule coming back alone', () => {
		expect(parametersPicked(RULE, CLEARED_SCOPE_PICKS)).toEqual([]);
		expect(verdictsKept(RULE, CLEARED_SCOPE_PICKS)).toBe(false);
		expect(tagsPicked(RULE, CLEARED_SCOPE_PICKS)).toEqual([]);

		const picks = resetRulePicks(CLEARED_SCOPE_PICKS, RULE);

		expect(parametersPicked(RULE, picks)).toEqual(['env', 'flag']);
		expect(tagsPicked(RULE, picks)).toEqual(TAGS.default);
		expect(parametersPicked(RULE_HW, picks)).toEqual([]);
	});

	it('empty one rule from its bin', () => {
		const picks = clearRulePicks(DEFAULT_SCOPE_PICKS, RULE_HW);

		expect(parametersPicked(RULE_HW, picks)).toEqual([]);
		expect(verdictsKept(RULE_HW, picks)).toBe(false);
		expect(tagsPicked(RULE_HW, picks)).toEqual([]);
		expect(parametersPicked(RULE, picks)).toEqual(['env', 'flag']);
	});
});

describe('matchersFor', () => {
	it('sends a matcher per rule, told by its test and runs', () => {
		expect(matchersFor(RUNS, DEFAULT_SCOPE_PICKS)).toEqual([
			{
				test_id: 21,
				run_ids: [7],
				parameters: RULE.parameters,
				verdicts: RULE.verdicts,
				tags: TAGS.default
			},
			{
				test_id: 21,
				run_ids: [8],
				parameters: RULE.parameters,
				verdicts: RULE.verdicts,
				tags: RULE_HW.tags.default
			}
		]);
	});

	it('cuts each matcher down to its own picks', () => {
		const picks = setRulePick(
			clearRulePicks(DEFAULT_SCOPE_PICKS, RULE_HW),
			RULE,
			{ parameters: ['env'] }
		);

		expect(matchersFor(RUNS, picks)).toEqual([
			{
				test_id: 21,
				run_ids: [7],
				parameters: { env: 'VAR.env.peer2peer_ipv6' },
				verdicts: RULE.verdicts,
				tags: TAGS.default
			},
			{ test_id: 21, run_ids: [8], parameters: {}, verdicts: null, tags: [] }
		]);
	});
});

describe('the rules stored', () => {
	it('are one per verdict list kept, else one', () => {
		expect(rulesOf(OTHER, DEFAULT_SCOPE_PICKS)).toBe(2);
		expect(
			rulesOf(
				OTHER,
				setRulePick(DEFAULT_SCOPE_PICKS, OTHER, { verdicts: false })
			)
		).toBe(1);
		expect(rulesWritten(MANY, DEFAULT_SCOPE_PICKS)).toBe(4);
	});

	it('are one for rules left matching on the same values', () => {
		expect(sameAsEarlier(RUNS, 1, DEFAULT_SCOPE_PICKS)).toBe(false);

		const picks = keepSharedTags(RUNS, DEFAULT_SCOPE_PICKS);

		expect(tagsPicked(RULE, picks)).toEqual(['fixture=net-drv-ts']);
		expect(tagsPicked(RULE_HW, picks)).toEqual(['fixture=net-drv-ts']);
		expect(sameAsEarlier(RUNS, 1, picks)).toBe(true);
		expect(sameAsEarlier(RUNS, 0, picks)).toBe(false);
		expect(rulesWritten(RUNS, picks)).toBe(1);
	});

	it('never merge the rules of different tests', () => {
		const picks = [RULE, OTHER].reduce(clearRulePicks, DEFAULT_SCOPE_PICKS);

		expect(sameAsEarlier([RULE, OTHER], 1, picks)).toBe(false);
		expect(rulesWritten([RULE, OTHER], picks)).toBe(2);
	});
});

describe('tags not every rule may take', () => {
	it('are counted once each among the kept ones', () => {
		expect(tagsApart(RUNS, DEFAULT_SCOPE_PICKS)).toEqual([
			'mix=warn',
			'mix=err'
		]);
		expect(tagsApart(ONE, DEFAULT_SCOPE_PICKS)).toEqual([]);
		expect(tagsApart(RUNS, keepSharedTags(RUNS, DEFAULT_SCOPE_PICKS))).toEqual(
			[]
		);
	});

	it('leave a relevant tag every rule may take kept', () => {
		const picks = setRulePick(DEFAULT_SCOPE_PICKS, RULE, {
			tags: ['kernel-linux', 'sfc', 'mix=warn']
		});

		expect(tagsPicked(RULE, keepSharedTags(RUNS, picks))).toEqual([
			'kernel-linux'
		]);
	});
});

describe('ruleStanding', () => {
	it('has nothing to say of a narrowed rule', () => {
		expect(ruleStanding(RULE, DEFAULT_SCOPE_PICKS)).toEqual({
			pathOnly: false,
			open: [],
			warnings: []
		});
	});

	it('warns of dropped verdicts and of removed parameters', () => {
		const picks = setRulePick(DEFAULT_SCOPE_PICKS, RULE, {
			parameters: [],
			verdicts: null
		});

		expect(ruleStanding(RULE, picks).warnings).toEqual([
			'Any parameters will match: all were removed.'
		]);
		expect(
			ruleStanding(
				RULE,
				setRulePick(DEFAULT_SCOPE_PICKS, RULE, { verdicts: false })
			)
		).toMatchObject({
			open: ['verdicts'],
			warnings: ['Any verdicts will match: they are not kept.']
		});
	});

	it('says when the results share no parameter', () => {
		expect(ruleStanding(OTHER, DEFAULT_SCOPE_PICKS).warnings).toEqual([
			'Any parameters will match: the selected results share none.'
		]);
	});

	it('tells a path-only rule with tags from one without', () => {
		const tagged = setRulePick(DEFAULT_SCOPE_PICKS, RULE, {
			parameters: [],
			verdicts: false
		});

		expect(ruleStanding(RULE, tagged)).toMatchObject({
			pathOnly: true,
			warnings: [
				'Every failure of this test in a run with the kept tags will match.'
			]
		});
		expect(
			ruleStanding(RULE, clearRulePicks(DEFAULT_SCOPE_PICKS, RULE)).warnings
		).toEqual([
			'Every failure of this test will match: nothing but the path is kept.'
		]);
	});
});

describe('chipsForRule', () => {
	it('an unconstrained rule matches on path alone', () => {
		expect(chipsForRule({ parameters: {}, verdicts: null, tags: [] })).toEqual([
			'Path'
		]);
	});

	it('treats missing criteria as ignored', () => {
		expect(chipsForRule({})).toEqual(['Path']);
		expect(
			chipsForRule({ parameters: null, verdicts: null, tags: null })
		).toEqual(['Path']);
	});

	it('names each criterion matched on, widest gate last', () => {
		expect(
			chipsForRule({ parameters: { env: 'ci' }, verdicts: null, tags: [] })
		).toEqual(['Path', 'Params']);
		expect(
			chipsForRule({ parameters: {}, verdicts: ['timeout'], tags: [] })
		).toEqual(['Path', 'Verdicts']);
		expect(
			chipsForRule({ parameters: {}, verdicts: null, tags: ['x=1'] })
		).toEqual(['Path', 'Tags']);
	});

	it('empty verdicts are a criterion: only a failure without any', () => {
		expect(chipsForRule({ parameters: {}, verdicts: [], tags: [] })).toEqual([
			'Path',
			'Verdicts'
		]);
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
