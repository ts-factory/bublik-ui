/* SPDX-License-Identifier: Apache-2.0 */
import { describe, expect, it } from 'vitest';

import {
	CLEARED_SCOPE_PICKS,
	DEFAULT_SCOPE_PICKS,
	chipsForRule,
	clearTestPicks,
	matcherForTest,
	parameterOptions,
	parametersPicked,
	resetTestPicks,
	rulesForTest,
	setTestPick,
	tagOptions,
	tagsPicked,
	testStanding,
	verdictsKept,
	type ScopePicks
} from './match-scope.utils';

const TEST = {
	test_id: 21,
	test_name: 'ethtool_reset_nic',
	test_path: 'net-drv-ts/basic/ethtool_reset_nic',
	result_ids: [8357],
	parameters: { env: 'VAR.env.peer2peer_ipv6', flag: 'DEDICATED' },
	verdicts: [['Generated unexpected result']]
};

const TAGS = {
	default: ['fixture=net-drv-ts', 'mix=warn'],
	allowed: ['fixture=net-drv-ts', 'kernel-linux', 'mix=warn', 'sfc']
};

const OPTIONS = { run_id: 7, tags: TAGS, tests: [TEST] };

const OTHER_TEST = {
	test_id: 22,
	test_name: 'rx_fcs',
	test_path: 'net-drv-ts/rx_path/rx_fcs',
	result_ids: [8, 9],
	parameters: { flag: 'DEDICATED', mtu: '1500' },
	// One result failed with two verdicts, the other with none.
	verdicts: [['Packets dropped', 'Timeout'], []]
};

const MANY = { run_id: 7, tags: TAGS, tests: [TEST, OTHER_TEST] };

describe('parameterOptions', () => {
	it('offers the parameters as key: value, sending key=value', () => {
		expect(
			parameterOptions(TEST).map(({ value, label }) => ({ value, label }))
		).toEqual([
			{
				value: 'env=VAR.env.peer2peer_ipv6',
				label: 'env: VAR.env.peer2peer_ipv6'
			},
			{ value: 'flag=DEDICATED', label: 'flag: DEDICATED' }
		]);
	});
});

describe('tagOptions', () => {
	it('puts the important tags first and marks them', () => {
		expect(
			tagOptions(OPTIONS).map(({ value, important }) => ({ value, important }))
		).toEqual([
			{ value: 'fixture=net-drv-ts', important: true },
			{ value: 'mix=warn', important: true },
			{ value: 'kernel-linux', important: false },
			{ value: 'sfc', important: false }
		]);
	});
});

describe('parametersPicked, verdictsKept and tagsPicked', () => {
	it('keeps everything shared, the verdicts and the important tags until touched', () => {
		expect(parametersPicked(TEST, DEFAULT_SCOPE_PICKS)).toEqual([
			'env=VAR.env.peer2peer_ipv6',
			'flag=DEDICATED'
		]);
		expect(verdictsKept(TEST, DEFAULT_SCOPE_PICKS)).toBe(true);
		expect(tagsPicked(OPTIONS, DEFAULT_SCOPE_PICKS)).toEqual([
			'fixture=net-drv-ts',
			'mix=warn'
		]);
	});

	it('keeps the picks of a touched test, in the offered order', () => {
		const picks = setTestPick(DEFAULT_SCOPE_PICKS, 21, {
			parameters: ['flag=DEDICATED']
		});

		expect(parametersPicked(TEST, picks)).toEqual(['flag=DEDICATED']);
		expect(verdictsKept(TEST, picks)).toBe(true);
	});

	it('leaves the other tests alone', () => {
		const picks = setTestPick(DEFAULT_SCOPE_PICKS, 21, {
			parameters: [],
			verdicts: false
		});

		expect(parametersPicked(OTHER_TEST, picks)).toEqual([
			'flag=DEDICATED',
			'mtu=1500'
		]);
		expect(verdictsKept(OTHER_TEST, picks)).toBe(true);
	});

	it('counts a rule per verdict list kept, else one', () => {
		expect(rulesForTest(TEST, DEFAULT_SCOPE_PICKS)).toBe(1);
		expect(rulesForTest(OTHER_TEST, DEFAULT_SCOPE_PICKS)).toBe(2);
		expect(
			rulesForTest(
				OTHER_TEST,
				setTestPick(DEFAULT_SCOPE_PICKS, 22, { verdicts: false })
			)
		).toBe(1);
	});

	it('drops picks the options no longer offer', () => {
		const picks: ScopePicks = {
			...DEFAULT_SCOPE_PICKS,
			tags: ['sfc', 'gone']
		};

		expect(tagsPicked(OPTIONS, picks)).toEqual(['sfc']);
	});
});

describe('clearing and resetting', () => {
	it('an unlisted test reads the fallback the bin set', () => {
		expect(parametersPicked(TEST, CLEARED_SCOPE_PICKS)).toEqual([]);
		expect(verdictsKept(TEST, CLEARED_SCOPE_PICKS)).toBe(false);
		expect(tagsPicked(OPTIONS, CLEARED_SCOPE_PICKS)).toEqual([]);
	});

	it('a test reset after the bin is back to its defaults', () => {
		const picks = resetTestPicks(CLEARED_SCOPE_PICKS, 21);

		expect(parametersPicked(TEST, picks)).toEqual([
			'env=VAR.env.peer2peer_ipv6',
			'flag=DEDICATED'
		]);
		expect(verdictsKept(TEST, picks)).toBe(true);
		expect(parametersPicked(OTHER_TEST, picks)).toEqual([]);
	});

	it('a cleared test is emptied alone', () => {
		const picks = clearTestPicks(DEFAULT_SCOPE_PICKS, 22);

		expect(verdictsKept(OTHER_TEST, picks)).toBe(false);
		expect(verdictsKept(TEST, picks)).toBe(true);
	});
});

describe('matcherForTest', () => {
	it('sends everything shared and the important tags by default', () => {
		expect(matcherForTest(TEST, OPTIONS, DEFAULT_SCOPE_PICKS)).toEqual({
			test_id: 21,
			parameters: TEST.parameters,
			verdicts: TEST.verdicts,
			tags: ['fixture=net-drv-ts', 'mix=warn']
		});
	});

	it('sends emptied parameters empty and dropped verdicts null', () => {
		const picks = setTestPick(DEFAULT_SCOPE_PICKS, 21, {
			parameters: [],
			verdicts: false
		});

		expect(matcherForTest(TEST, OPTIONS, picks)).toMatchObject({
			parameters: {},
			verdicts: null
		});
	});

	it('sends every verdict list of a test as the options gave them', () => {
		expect(
			matcherForTest(OTHER_TEST, MANY, DEFAULT_SCOPE_PICKS).verdicts
		).toEqual([['Packets dropped', 'Timeout'], []]);
	});

	it('gives each test only its own picked values', () => {
		const picks = setTestPick(
			setTestPick(DEFAULT_SCOPE_PICKS, 21, { parameters: ['flag=DEDICATED'] }),
			22,
			{ parameters: ['mtu=1500'] }
		);

		expect(matcherForTest(TEST, MANY, picks).parameters).toEqual({
			flag: 'DEDICATED'
		});
		expect(matcherForTest(OTHER_TEST, MANY, picks).parameters).toEqual({
			mtu: '1500'
		});
	});
});

describe('testStanding', () => {
	it('warns of nothing while the rule is narrowed', () => {
		const matcher = matcherForTest(TEST, OPTIONS, DEFAULT_SCOPE_PICKS);

		expect(testStanding(TEST, matcher)).toEqual({
			pathOnly: false,
			open: [],
			warnings: []
		});
	});

	it('says when the results share nothing of a dimension', () => {
		const bare = { ...OTHER_TEST, parameters: {} };
		const matcher = matcherForTest(bare, MANY, DEFAULT_SCOPE_PICKS);

		expect(testStanding(bare, matcher)).toEqual({
			pathOnly: false,
			open: ['parameters'],
			warnings: ['Any parameters will match: the selected results share none.']
		});
	});

	it('says when every parameter was removed, and when the verdicts were dropped', () => {
		const parameters = matcherForTest(
			TEST,
			OPTIONS,
			setTestPick(DEFAULT_SCOPE_PICKS, 21, { parameters: [] })
		);
		const verdicts = matcherForTest(
			TEST,
			OPTIONS,
			setTestPick(DEFAULT_SCOPE_PICKS, 21, { verdicts: false })
		);

		expect(testStanding(TEST, parameters).warnings).toEqual([
			'Any parameters will match: all were removed.'
		]);
		expect(testStanding(TEST, verdicts).warnings).toEqual([
			'Any verdicts will match: they are not kept.'
		]);
	});

	it('warns once of a rule left to the path, tags or not', () => {
		const withTags = matcherForTest(TEST, OPTIONS, {
			...DEFAULT_SCOPE_PICKS,
			fallback: { parameters: [], verdicts: false }
		});
		const bare = matcherForTest(TEST, OPTIONS, CLEARED_SCOPE_PICKS);

		expect(testStanding(TEST, withTags)).toEqual({
			pathOnly: true,
			open: ['parameters', 'verdicts'],
			warnings: [
				'Every failure of this test in a run with the kept tags will match.'
			]
		});
		expect(testStanding(TEST, bare).warnings).toEqual([
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
