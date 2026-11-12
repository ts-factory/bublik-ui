/* SPDX-License-Identifier: Apache-2.0 */
import { describe, expect, it } from 'vitest';

import type { ClassifyOptions, ClassifyRuleOptions } from '@/shared/types';

import {
	CLEARED_SCOPE_PICKS,
	DEFAULT_SCOPE_PICKS,
	chipsForRule,
	clearTestPicks,
	flatRules,
	matchersFor,
	parameterOptions,
	parametersPicked,
	resetTestPicks,
	setTestPick,
	tagOptions,
	tagsPicked,
	testStanding,
	testsOf,
	verdictListsOf,
	verdictsKept,
	writtenRules,
	type ScopePicks,
	type ScopeTest
} from './match-scope.utils';

const TAGS = {
	default: ['fixture=net-drv-ts', 'mix=warn'],
	allowed: ['fixture=net-drv-ts', 'kernel-linux', 'mix=warn', 'sfc']
};

/** One result of one test: the rule a row's own Classify button gets. */
const RULE: ClassifyRuleOptions = {
	test_id: 21,
	test_name: 'ethtool_reset_nic',
	test_path: 'net-drv-ts/basic/ethtool_reset_nic',
	run_ids: [7],
	result_ids: [8357],
	parameters: { env: 'VAR.env.peer2peer_ipv6', flag: 'DEDICATED' },
	verdicts: [['Generated unexpected result']],
	tags: TAGS
};

/** The same test with another `env`, in a run with one more important tag. */
const RULE_HW: ClassifyRuleOptions = {
	...RULE,
	run_ids: [8],
	result_ids: [9001, 9002],
	parameters: { env: 'VAR.env.hw', flag: 'DEDICATED' },
	verdicts: [['Link down']],
	tags: {
		default: [...TAGS.default, 'kernel=6.2'],
		allowed: [...TAGS.allowed, 'kernel=6.2']
	}
};

const OTHER_RULE: ClassifyRuleOptions = {
	test_id: 22,
	test_name: 'rx_fcs',
	test_path: 'net-drv-ts/rx_path/rx_fcs',
	run_ids: [7],
	result_ids: [8, 9],
	parameters: { flag: 'DEDICATED', mtu: '1500' },
	// One result failed with two verdicts, the other with none.
	verdicts: [['Packets dropped', 'Timeout'], []],
	tags: TAGS
};

const ONE: ClassifyOptions = [RULE];
const SPECIFIC: ClassifyOptions = [RULE, RULE_HW];
const MANY: ClassifyOptions = [RULE, OTHER_RULE];

const [TEST] = testsOf(ONE);
const [SPLIT] = testsOf(SPECIFIC);
const [, OTHER_TEST] = testsOf(MANY);

describe('testsOf', () => {
	it('puts the rules of a test together, in the order the tests appear', () => {
		const tests = testsOf([RULE, OTHER_RULE, RULE_HW]);

		expect(tests.map((test) => test.test_id)).toEqual([21, 22]);
		expect(tests[0].rules).toEqual([RULE, RULE_HW]);
		expect(tests[0].result_ids).toEqual([8357, 9001, 9002]);
	});
});

describe('parameterOptions', () => {
	it('offers the parameters by name, reading name: value', () => {
		expect(parameterOptions(TEST)).toEqual([
			{
				value: 'env',
				label: 'env: VAR.env.peer2peer_ipv6',
				important: false
			},
			{
				value: 'flag',
				label: 'flag: DEDICATED',
				important: false
			}
		]);
	});

	it('counts the values of a name the rules differ in', () => {
		expect(parameterOptions(SPLIT)).toEqual([
			{ value: 'env', label: 'env: 2 values', important: false },
			{
				value: 'flag',
				label: 'flag: DEDICATED',
				important: false
			}
		]);
	});

	it('says when only some of the rules have a name', () => {
		const [test] = testsOf([
			RULE,
			{ ...RULE_HW, parameters: { flag: 'DEDICATED' } }
		]);

		expect(parameterOptions(test)[0]).toEqual({
			value: 'env',
			label: 'env: VAR.env.peer2peer_ipv6, some results',
			important: false
		});
	});
});

describe('tagOptions', () => {
	it('puts the important tags first and marks them', () => {
		expect(
			tagOptions(ONE).map((option) => [option.value, option.important])
		).toEqual([
			['fixture=net-drv-ts', true],
			['mix=warn', true],
			['kernel-linux', false],
			['sfc', false]
		]);
	});
});

describe('parametersPicked, verdictsKept and tagsPicked', () => {
	it('keeps every name, the verdicts and the important tags until touched', () => {
		expect(parametersPicked(TEST, DEFAULT_SCOPE_PICKS)).toEqual([
			'env',
			'flag'
		]);
		expect(verdictsKept(TEST, DEFAULT_SCOPE_PICKS)).toBe(true);
		expect(tagsPicked(SPECIFIC, DEFAULT_SCOPE_PICKS)).toEqual([
			'fixture=net-drv-ts',
			'mix=warn',
			'kernel=6.2'
		]);
	});

	it('keeps the picks of a touched test, in the offered order', () => {
		const picks = setTestPick(DEFAULT_SCOPE_PICKS, 21, {
			parameters: ['flag', 'env']
		});

		expect(parametersPicked(TEST, picks)).toEqual(['env', 'flag']);
	});

	it('leaves the other tests alone', () => {
		const picks = setTestPick(DEFAULT_SCOPE_PICKS, 21, {
			parameters: [],
			verdicts: false
		});

		expect(parametersPicked(OTHER_TEST, picks)).toEqual(['flag', 'mtu']);
		expect(verdictsKept(OTHER_TEST, picks)).toBe(true);
	});

	it('drops picks the options no longer offer', () => {
		const picks: ScopePicks = {
			tags: ['gone', 'sfc'],
			tests: { '21': { parameters: ['gone', 'flag'], verdicts: null } },
			fallback: null
		};

		expect(parametersPicked(TEST, picks)).toEqual(['flag']);
		expect(tagsPicked(ONE, picks)).toEqual(['sfc']);
	});
});

describe('clearing and resetting', () => {
	it('an unlisted test reads the fallback the bin set', () => {
		expect(parametersPicked(TEST, CLEARED_SCOPE_PICKS)).toEqual([]);
		expect(verdictsKept(TEST, CLEARED_SCOPE_PICKS)).toBe(false);
		expect(tagsPicked(ONE, CLEARED_SCOPE_PICKS)).toEqual([]);
	});

	it('a test reset after the bin is back to its defaults', () => {
		const picks = resetTestPicks(CLEARED_SCOPE_PICKS, 21);

		expect(parametersPicked(TEST, picks)).toEqual(['env', 'flag']);
		expect(verdictsKept(TEST, picks)).toBe(true);
		expect(parametersPicked(OTHER_TEST, picks)).toEqual([]);
	});

	it('a cleared test is emptied alone', () => {
		const picks = clearTestPicks(DEFAULT_SCOPE_PICKS, 21);

		expect(parametersPicked(TEST, picks)).toEqual([]);
		expect(verdictsKept(TEST, picks)).toBe(false);
		expect(parametersPicked(OTHER_TEST, picks)).toEqual(['flag', 'mtu']);
	});
});

describe('matchersFor', () => {
	it('sends each rule everything its own results carry by default', () => {
		expect(matchersFor(SPECIFIC, DEFAULT_SCOPE_PICKS)).toEqual([
			{
				test_id: 21,
				result_ids: [8357],
				parameters: { env: 'VAR.env.peer2peer_ipv6', flag: 'DEDICATED' },
				verdicts: [['Generated unexpected result']],
				tags: ['fixture=net-drv-ts', 'mix=warn']
			},
			{
				test_id: 21,
				result_ids: [9001, 9002],
				parameters: { env: 'VAR.env.hw', flag: 'DEDICATED' },
				verdicts: [['Link down']],
				tags: ['fixture=net-drv-ts', 'mix=warn', 'kernel=6.2']
			}
		]);
	});

	it('takes a name left out off every rule of the test, and only of it', () => {
		const picks = setTestPick(DEFAULT_SCOPE_PICKS, 21, {
			parameters: ['flag']
		});
		const matchers = matchersFor([...SPECIFIC, OTHER_RULE], picks);

		expect(matchers.map((matcher) => matcher.parameters)).toEqual([
			{ flag: 'DEDICATED' },
			{ flag: 'DEDICATED' },
			{ flag: 'DEDICATED', mtu: '1500' }
		]);
	});

	it('sends emptied parameters empty and dropped verdicts null', () => {
		const [matcher] = matchersFor(ONE, clearTestPicks(DEFAULT_SCOPE_PICKS, 21));

		expect(matcher.parameters).toEqual({});
		expect(matcher.verdicts).toBeNull();
		expect(matcher.tags).toEqual(['fixture=net-drv-ts', 'mix=warn']);
	});

	it('gives a rule the picked tags its own runs have', () => {
		const picks: ScopePicks = {
			...DEFAULT_SCOPE_PICKS,
			tags: ['kernel=6.2', 'sfc']
		};

		expect(matchersFor(SPECIFIC, picks).map((matcher) => matcher.tags)).toEqual(
			[['sfc'], ['kernel=6.2', 'sfc']]
		);
	});

	it('names the rule of each matcher by its results', () => {
		expect(
			matchersFor(MANY, DEFAULT_SCOPE_PICKS).map(
				(matcher) => matcher.result_ids
			)
		).toEqual([[8357], [8, 9]]);
	});
});

describe('flatRules', () => {
	it('lists every rule with all it matches on', () => {
		expect(flatRules(SPLIT, DEFAULT_SCOPE_PICKS)).toEqual([
			{
				parameters: RULE.parameters,
				tags: RULE.tags.default,
				verdicts: ['Generated unexpected result'],
				results: 1
			},
			{
				parameters: RULE_HW.parameters,
				tags: RULE_HW.tags.default,
				verdicts: ['Link down'],
				results: 2
			}
		]);
	});

	it('lists merged rules once per verdict list, without result counts', () => {
		const picks: ScopePicks = {
			tags: ['fixture=net-drv-ts'],
			tests: { '21': { parameters: ['flag'], verdicts: null } },
			fallback: null
		};

		expect(flatRules(SPLIT, picks).map((rule) => rule.verdicts)).toEqual([
			['Generated unexpected result'],
			['Link down']
		]);
		expect(flatRules(SPLIT, picks).map((rule) => rule.results)).toEqual([
			null,
			null
		]);
	});

	it('lists one rule matching any verdicts once they are dropped', () => {
		const picks: ScopePicks = {
			tags: [],
			tests: { '21': { parameters: [], verdicts: false } },
			fallback: null
		};

		expect(flatRules(SPLIT, picks)).toEqual([
			{ parameters: {}, tags: [], verdicts: null, results: 3 }
		]);
	});
});

const rulesOf = (test: ScopeTest, picks: ScopePicks) =>
	flatRules(test, picks).length;

describe('writtenRules', () => {
	it('lists a rule per set of parameters and tags', () => {
		const written = writtenRules(SPLIT, DEFAULT_SCOPE_PICKS);

		expect(
			written.map((entry) => [entry.parameters.env, entry.results, entry.rules])
		).toEqual([
			['VAR.env.peer2peer_ipv6', 1, 1],
			['VAR.env.hw', 2, 1]
		]);
		expect(rulesOf(SPLIT, DEFAULT_SCOPE_PICKS)).toBe(2);
	});

	it('keeps rules apart while anything still tells them apart', () => {
		const picks = setTestPick(DEFAULT_SCOPE_PICKS, 21, {
			parameters: ['flag']
		});

		// The second run's extra important tag.
		expect(writtenRules(SPLIT, picks)).toHaveLength(2);
	});

	it('merges rules left the same, a rule per verdict list of them all', () => {
		const picks: ScopePicks = {
			tags: ['fixture=net-drv-ts'],
			tests: { '21': { parameters: ['flag'], verdicts: null } },
			fallback: null
		};

		expect(writtenRules(SPLIT, picks)).toEqual([
			{
				parameters: { flag: 'DEDICATED' },
				tags: ['fixture=net-drv-ts'],
				verdicts: [['Generated unexpected result'], ['Link down']],
				results: 3,
				rules: 2
			}
		]);
		expect(rulesOf(SPLIT, setTestPick(picks, 21, { verdicts: false }))).toBe(1);
	});

	it('counts a rule per verdict list kept, else one', () => {
		expect(rulesOf(OTHER_TEST, DEFAULT_SCOPE_PICKS)).toBe(2);
		expect(
			rulesOf(
				OTHER_TEST,
				setTestPick(DEFAULT_SCOPE_PICKS, 22, { verdicts: false })
			)
		).toBe(1);
	});

	it('gives every verdict list of a test once', () => {
		expect(
			verdictListsOf(
				testsOf([RULE, { ...RULE_HW, verdicts: RULE.verdicts }])[0]
			)
		).toEqual([['Generated unexpected result']]);
	});
});

describe('testStanding', () => {
	it('warns of nothing while the rules are narrowed', () => {
		expect(testStanding(SPLIT, DEFAULT_SCOPE_PICKS)).toEqual({
			pathOnly: false,
			open: [],
			warnings: []
		});
	});

	it('says when the results have nothing of a dimension', () => {
		const [test] = testsOf([{ ...RULE, parameters: {} }]);

		expect(testStanding(test, DEFAULT_SCOPE_PICKS).warnings).toEqual([
			'Any parameters will match: the selected results have none.'
		]);
	});

	it('says when every parameter was removed, and when the verdicts were dropped', () => {
		expect(
			testStanding(
				TEST,
				setTestPick(DEFAULT_SCOPE_PICKS, 21, { parameters: [] })
			).warnings
		).toEqual(['Any parameters will match: all were removed.']);
		expect(
			testStanding(
				TEST,
				setTestPick(DEFAULT_SCOPE_PICKS, 21, { verdicts: false })
			).warnings
		).toEqual(['Any verdicts will match: they are not kept.']);
	});

	it('warns once of rules left to the path, tags or not', () => {
		const cleared = clearTestPicks(DEFAULT_SCOPE_PICKS, 21);

		expect(testStanding(TEST, cleared)).toEqual({
			pathOnly: true,
			open: ['parameters', 'verdicts'],
			warnings: [
				'Every failure of this test in a run with the kept tags will match.'
			]
		});
		expect(testStanding(TEST, { ...cleared, tags: [] }).warnings).toEqual([
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

describe('testStanding of rules that are not equally wide', () => {
	const [test] = testsOf([
		RULE,
		{ ...RULE_HW, parameters: {}, tags: { default: [], allowed: [] } }
	]);

	it('warns of the one rule without parameters', () => {
		expect(testStanding(test, DEFAULT_SCOPE_PICKS).warnings).toEqual([
			'Any parameters will match one of the rules: it keeps none.'
		]);
	});

	it('warns of the widest rule once the verdicts are dropped', () => {
		const picks = setTestPick(DEFAULT_SCOPE_PICKS, 21, { verdicts: false });

		expect(testStanding(test, picks)).toMatchObject({
			pathOnly: true,
			warnings: [
				'One of the rules matches every failure of this test: nothing but the path is kept.'
			]
		});
	});
});
