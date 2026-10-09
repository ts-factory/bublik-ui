/* SPDX-License-Identifier: Apache-2.0 */
import type {
	ClassifyMatcher,
	ClassifyOptions,
	ClassifyOptionsTest
} from '@/shared/types';
import { config } from '@/bublik/config';

import { displayKeyValue } from './matcher-fields.utils';

/** The dimensions of a rule the classify form lets the reader narrow. */
export type ScopeField = 'parameters' | 'verdicts' | 'tags';

/** The dimensions a test's own results decide, unlike the run's tags. */
export type TestScopeField = Exclude<ScopeField, 'tags'>;

/**
 * What the reader kept of one test's dimensions. The parameters as the
 * matcher sends them, `key=value`; null until the reader changes the field,
 * since its default is only known once the options arrive: every value the
 * test's results share. The verdicts are kept whole or not at all, as the
 * server matches them exactly: true keeps every verdict list of the test's
 * results, false ignores them, null is the default, kept.
 */
export interface TestPicks {
	parameters: string[] | null;
	verdicts: boolean | null;
}

/**
 * What the reader kept, per test: each test gets its own rule, and a rule
 * never takes another test's values. The tags are the run's, shared by every
 * rule; null keeps the run's important ones.
 */
export interface ScopePicks {
	tags: string[] | null;
	/** By test id; a test not listed reads `fallback`. */
	tests: Record<string, TestPicks>;
	/**
	 * What an unlisted test's pickers hold: null for their defaults, empty
	 * lists once the section's bin emptied every picker, which happens
	 * outside the match scope, before it may know the tests.
	 */
	fallback: TestPicks | null;
}

export const DEFAULT_SCOPE_PICKS: ScopePicks = {
	tags: null,
	tests: {},
	fallback: null
};

/** Every picker emptied: the rules match on their paths alone. */
export const CLEARED_SCOPE_PICKS: ScopePicks = {
	tags: [],
	tests: {},
	fallback: { parameters: [], verdicts: false }
};

/** One value a dimension's picker offers. */
export interface ScopeOption {
	value: string;
	label: string;
	/** One of the run's important tags, kept by default. */
	important: boolean;
}

function parameterValue(key: string, value: string): string {
	return `${key}${config.keyValueSubmitDelimiter}${value}`;
}

/**
 * What one test's Parameters picker offers: only what
 * `/results/classify/options/` says all of the test's results carry, so its
 * rules always match them.
 */
export function parameterOptions(test: ClassifyOptionsTest): ScopeOption[] {
	return Object.entries(test.parameters)
		.map(([key, value]) => parameterValue(key, value))
		.map((value) => ({
			value,
			label: displayKeyValue(value),
			important: false
		}))
		.sort((left, right) => left.label.localeCompare(right.label));
}

/**
 * The tags a rule may take: the run's important ones first, then the
 * relevant ones, as the run page shows them.
 */
export function tagOptions(options: ClassifyOptions): ScopeOption[] {
	const important = new Set(options.tags.default);
	const all = Array.from(
		new Set([...options.tags.default, ...options.tags.allowed])
	);

	return [
		...all.filter((tag) => important.has(tag)),
		...all.filter((tag) => !important.has(tag))
	].map((tag) => ({
		value: tag,
		label: displayKeyValue(tag),
		important: important.has(tag)
	}));
}

function picksOf(picks: ScopePicks, testId: number): TestPicks | null {
	return picks.tests[String(testId)] ?? picks.fallback;
}

/**
 * The parameters one test's rules keep: the reader's picks once they made
 * any, else everything the test's results share. Picks the options no
 * longer offer are dropped.
 */
export function parametersPicked(
	test: ClassifyOptionsTest,
	picks: ScopePicks
): string[] {
	const offered = parameterOptions(test).map((option) => option.value);
	const picked = picksOf(picks, test.test_id)?.parameters ?? null;

	if (picked === null) return offered;

	const kept = new Set(picked);

	return offered.filter((value) => kept.has(value));
}

/** Whether one test's rules keep its verdict lists; they do until dropped. */
export function verdictsKept(test: ClassifyOptionsTest, picks: ScopePicks) {
	return picksOf(picks, test.test_id)?.verdicts ?? true;
}

/**
 * How many rules one test gets per category: one per verdict list kept, as
 * the verdicts are matched exactly, else one for all of its results.
 */
export function rulesForTest(test: ClassifyOptionsTest, picks: ScopePicks) {
	return verdictsKept(test, picks) ? Math.max(test.verdicts.length, 1) : 1;
}

/** The tags every rule keeps: the reader's picks, else the important ones. */
export function tagsPicked(
	options: ClassifyOptions,
	picks: ScopePicks
): string[] {
	const offered = tagOptions(options);

	if (picks.tags === null) {
		return offered
			.filter((option) => option.important)
			.map((option) => option.value);
	}

	const kept = new Set(picks.tags);

	return offered
		.filter((option) => kept.has(option.value))
		.map((option) => option.value);
}

export function setTestPick(
	picks: ScopePicks,
	testId: number,
	next: Partial<TestPicks>
): ScopePicks {
	const current = picksOf(picks, testId) ?? {
		parameters: null,
		verdicts: null
	};

	return {
		...picks,
		tests: { ...picks.tests, [String(testId)]: { ...current, ...next } }
	};
}

/** One test's pickers back to their defaults, whatever the bin did to all. */
export function resetTestPicks(picks: ScopePicks, testId: number): ScopePicks {
	return {
		...picks,
		tests: {
			...picks.tests,
			[String(testId)]: { parameters: null, verdicts: null }
		}
	};
}

/** One test's pickers emptied: its rule matches on the path and the tags. */
export function clearTestPicks(picks: ScopePicks, testId: number): ScopePicks {
	return {
		...picks,
		tests: {
			...picks.tests,
			[String(testId)]: { parameters: [], verdicts: false }
		}
	};
}

/**
 * The matcher of one test's rules: what `/results/classify/options/` says the
 * test's results share, cut down to the reader's picks. Emptied parameters
 * or tags are sent empty, and dropped verdicts null, which the endpoint reads
 * as "do not match on it"; kept verdicts are every list the options gave,
 * the only thing it accepts besides null.
 */
export function matcherForTest(
	test: ClassifyOptionsTest,
	options: ClassifyOptions,
	picks: ScopePicks
): ClassifyMatcher {
	const parameters = new Set(parametersPicked(test, picks));

	return {
		test_id: test.test_id,
		parameters: Object.fromEntries(
			Object.entries(test.parameters).filter(([key, value]) =>
				parameters.has(parameterValue(key, value))
			)
		),
		verdicts: verdictsKept(test, picks) ? test.verdicts : null,
		tags: tagsPicked(options, picks)
	};
}

/**
 * Where one test's rules would match more than the reader may expect: the
 * dimensions they do not narrow, because the test's results share no
 * parameter, every parameter was dropped or the verdicts were, each with a
 * sentence saying which.
 */
export interface TestStanding {
	/** Nothing but the path, and the tags if any, is kept. */
	pathOnly: boolean;
	/** The dimensions the rules do not narrow. */
	open: TestScopeField[];
	/** One sentence per thing the reader may not expect; none when narrowed. */
	warnings: string[];
}

export function testStanding(
	test: ClassifyOptionsTest,
	matcher: ClassifyMatcher
): TestStanding {
	const open: TestScopeField[] = [];

	if (!Object.keys(matcher.parameters).length) open.push('parameters');
	if (matcher.verdicts === null) open.push('verdicts');

	const pathOnly = open.length === 2;

	if (pathOnly) {
		return {
			pathOnly,
			open,
			warnings: [
				matcher.tags.length
					? 'Every failure of this test in a run with the kept tags will match.'
					: 'Every failure of this test will match: nothing but the path is kept.'
			]
		};
	}

	return {
		pathOnly,
		open,
		warnings: open.map((field) => {
			if (field === 'verdicts') {
				return 'Any verdicts will match: they are not kept.';
			}

			return Object.keys(test.parameters).length === 0
				? 'Any parameters will match: the selected results share none.'
				: 'Any parameters will match: all were removed.';
		})
	};
}

/**
 * The dimensions a stored rule matches on. Empty parameters or tags are
 * ignored, so they add no chip; the verdicts are ignored only when null, as
 * `[]` keeps the rule to failures without a verdict.
 */
export function chipsForRule(rule: {
	parameters?: Record<string, string> | null;
	verdicts?: string[] | null;
	tags?: string[] | null;
}): string[] {
	const chips = ['Path'];
	if (Object.keys(rule.parameters ?? {}).length) chips.push('Params');
	if (rule.verdicts) chips.push('Verdicts');
	if ((rule.tags ?? []).length) chips.push('Tags');
	return chips;
}
