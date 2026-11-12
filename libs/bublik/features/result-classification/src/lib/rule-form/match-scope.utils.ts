/* SPDX-License-Identifier: Apache-2.0 */
import type {
	ClassifyMatcher,
	ClassifyOptions,
	ClassifyRuleOptions
} from '@/shared/types';
import { config } from '@/bublik/config';

import { displayKeyValue } from './matcher-fields.utils';

/** The dimensions of a rule the classify form lets the reader narrow. */
export type ScopeField = 'parameters' | 'verdicts' | 'tags';

/** The dimensions a test's own results decide, unlike the runs' tags. */
export type TestScopeField = Exclude<ScopeField, 'tags'>;

/**
 * What the reader kept of one test's dimensions, for every rule of the test.
 * The parameters are kept by name: a rule keeps its own value of each kept
 * name, so the rules stay as specific as their results, and leaving a name
 * out takes it off all of them. Null until the reader changes the field,
 * since its default is only known once the options arrive: every name. The
 * verdicts are kept whole or not at all, as the server matches them exactly:
 * true keeps every verdict list of the results, false ignores them, null is
 * the default, kept.
 */
export interface TestPicks {
	parameters: string[] | null;
	verdicts: boolean | null;
}

/**
 * What the reader kept, per test: each test gets its own rules, and a rule
 * never takes another test's values. The tags are picked once for all the
 * rules, and a rule keeps those of them its runs have; null keeps each
 * rule's important ones.
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
	/** An important tag of the runs, kept by default. */
	important: boolean;
}

/** One test among the results, with the rules the options give it. */
export interface ScopeTest {
	test_id: number;
	test_name: string;
	test_path: string;
	/** Every result of the test being classified. */
	result_ids: number[];
	rules: ClassifyRuleOptions[];
}

/** The options' rules by test, in the order the tests first appear. */
export function testsOf(options: ClassifyOptions): ScopeTest[] {
	const tests = new Map<number, ScopeTest>();

	for (const rule of options) {
		const test = tests.get(rule.test_id);

		if (test) {
			test.rules.push(rule);
			test.result_ids.push(...rule.result_ids);
		} else {
			tests.set(rule.test_id, {
				test_id: rule.test_id,
				test_name: rule.test_name,
				test_path: rule.test_path,
				result_ids: [...rule.result_ids],
				rules: [rule]
			});
		}
	}

	return Array.from(tests.values());
}

/** A parameter as a rule's matcher spells it, `key=value`. */
export function parameterValue(key: string, value: string): string {
	return `${key}${config.keyValueSubmitDelimiter}${value}`;
}

/**
 * What one test's Parameters picker offers: the names of the parameters its
 * results have. A name every rule has one value of reads `name: value`; one
 * the rules differ in reads with how many values it has.
 */
export function parameterOptions(test: ScopeTest): ScopeOption[] {
	const names = Array.from(
		new Set(test.rules.flatMap((rule) => Object.keys(rule.parameters)))
	);

	return names
		.map((name) => {
			const values = new Set(
				test.rules
					.filter((rule) => name in rule.parameters)
					.map((rule) => rule.parameters[name])
			);
			const everywhere = test.rules.every((rule) => name in rule.parameters);
			const [only] = values;

			if (values.size === 1 && everywhere) {
				return {
					value: name,
					label: displayKeyValue(parameterValue(name, only)),
					important: false
				};
			}

			return {
				value: name,
				label:
					values.size === 1
						? `${displayKeyValue(parameterValue(name, only))}, some results`
						: `${name}: ${values.size} values`,
				important: false
			};
		})
		.sort((left, right) => left.value.localeCompare(right.value));
}

/** The tags every rule's runs have: keeping one never splits the rules. */
export function sharedTags(options: ClassifyOptions): Set<string> {
	const [first, ...rest] = options.map(
		(rule) => new Set([...rule.tags.default, ...rule.tags.allowed])
	);

	return new Set(
		Array.from(first ?? []).filter((tag) => rest.every((tags) => tags.has(tag)))
	);
}

/**
 * The tags the rules may take: the important ones first, then the relevant
 * ones, as the run page shows them. Among each, the tags every rule's runs
 * have come first and the rest follow by name, so the values of one tag that
 * differs from run to run read together.
 */
export function tagOptions(options: ClassifyOptions): ScopeOption[] {
	const important = new Set(options.flatMap((rule) => rule.tags.default));
	const shared = sharedTags(options);
	const all = Array.from(
		new Set(
			options.flatMap((rule) => [...rule.tags.default, ...rule.tags.allowed])
		)
	).sort(
		(left, right) =>
			Number(shared.has(right)) - Number(shared.has(left)) ||
			left.localeCompare(right)
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

/**
 * The kept tags only some of the rules' runs have: each keeps the rules of
 * the runs with it apart from the others.
 */
export function tagsApart(options: ClassifyOptions, picks: ScopePicks) {
	const shared = sharedTags(options);

	return tagsPicked(options, picks).filter((tag) => !shared.has(tag));
}

/** The picks with only the tags every rule's runs have left kept. */
export function keepSharedTags(
	options: ClassifyOptions,
	picks: ScopePicks
): ScopePicks {
	const shared = sharedTags(options);

	return {
		...picks,
		tags: tagsPicked(options, picks).filter((tag) => shared.has(tag))
	};
}

function picksOf(picks: ScopePicks, testId: number): TestPicks | null {
	return picks.tests[String(testId)] ?? picks.fallback;
}

/**
 * The parameter names one test's rules keep: the reader's picks once they
 * made any, else every name. Picks the options no longer offer are dropped.
 */
export function parametersPicked(test: ScopeTest, picks: ScopePicks): string[] {
	const offered = parameterOptions(test).map((option) => option.value);
	const picked = picksOf(picks, test.test_id)?.parameters ?? null;

	if (picked === null) return offered;

	const kept = new Set(picked);

	return offered.filter((value) => kept.has(value));
}

/** Whether one test's rules keep its verdict lists; they do until dropped. */
export function verdictsKept(test: ScopeTest, picks: ScopePicks) {
	return picksOf(picks, test.test_id)?.verdicts ?? true;
}

/** What the Tags picker holds: the reader's picks, else the important ones. */
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

/** The tags one rule keeps: of those picked, the ones its runs have. */
function tagsOfRule(rule: ClassifyRuleOptions, picks: ScopePicks): string[] {
	if (picks.tags === null) return rule.tags.default;

	const kept = new Set(picks.tags);

	return Array.from(new Set([...rule.tags.default, ...rule.tags.allowed]))
		.filter((tag) => kept.has(tag))
		.sort();
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

/** One test's pickers emptied: its rules match on the path and the tags. */
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
 * The matcher of one of the options' rules: what the rule may contain, cut
 * down to the reader's picks for its test. Emptied parameters or tags are
 * sent empty, and dropped verdicts null, which the endpoint reads as "do not
 * match on it"; kept verdicts are every list the options gave, the only
 * thing it accepts besides null.
 */
export function matcherOfRule(
	rule: ClassifyRuleOptions,
	test: ScopeTest,
	picks: ScopePicks
): ClassifyMatcher {
	const names = new Set(parametersPicked(test, picks));

	return {
		test_id: rule.test_id,
		result_ids: rule.result_ids,
		parameters: Object.fromEntries(
			Object.entries(rule.parameters).filter(([name]) => names.has(name))
		),
		verdicts: verdictsKept(test, picks) ? rule.verdicts : null,
		tags: tagsOfRule(rule, picks)
	};
}

/** The matchers of a classify request: one per rule of the options. */
export function matchersFor(
	options: ClassifyOptions,
	picks: ScopePicks
): ClassifyMatcher[] {
	return testsOf(options).flatMap((test) =>
		test.rules.map((rule) => matcherOfRule(rule, test, picks))
	);
}

function sameVerdicts(left: readonly string[], right: readonly string[]) {
	return (
		left.length === right.length &&
		left.every((verdict, index) => verdict === right[index])
	);
}

function sameEntries(
	left: Record<string, string>,
	right: Record<string, string>
) {
	const keys = Object.keys(left);

	return (
		keys.length === Object.keys(right).length &&
		keys.every((key) => left[key] === right[key])
	);
}

/**
 * The rules one test gets that match on the same parameters and tags, as
 * the form lists them: one per verdict list kept, else one. Matchers that
 * come out the same are one entry, as the server writes one rule for them.
 */
export interface WrittenRules {
	parameters: Record<string, string>;
	tags: string[];
	/** The verdict lists kept, a rule each; null when they are ignored. */
	verdicts: string[][] | null;
	/** How many of the selected results these rules stamp. */
	results: number;
	/** How many rules per category: one per verdict list, else one. */
	rules: number;
}

export function writtenRules(
	test: ScopeTest,
	picks: ScopePicks
): WrittenRules[] {
	const written: WrittenRules[] = [];

	for (const rule of test.rules) {
		const matcher = matcherOfRule(rule, test, picks);
		const same = written.find(
			(entry) =>
				sameEntries(entry.parameters, matcher.parameters) &&
				entry.tags.join('\u0000') === matcher.tags.join('\u0000')
		);

		if (!same) {
			written.push({
				parameters: matcher.parameters,
				tags: matcher.tags,
				verdicts: matcher.verdicts ? [...matcher.verdicts] : null,
				results: rule.result_ids.length,
				rules: matcher.verdicts ? matcher.verdicts.length : 1
			});
			continue;
		}

		same.results += rule.result_ids.length;

		if (same.verdicts && matcher.verdicts) {
			for (const list of matcher.verdicts) {
				if (!same.verdicts.some((kept) => sameVerdicts(kept, list))) {
					same.verdicts.push(list);
				}
			}

			same.rules = same.verdicts.length;
		}
	}

	return written;
}

/** One rule a test gets, with everything it matches on besides the path. */
export interface FlatRule {
	parameters: Record<string, string>;
	tags: string[];
	/** The verdict list the rule matches exactly; null when it ignores them. */
	verdicts: string[] | null;
	/**
	 * How many of the selected results the rule stamps. Null when rules
	 * differing only in their verdicts share results: the options do not say
	 * which result failed with which list.
	 */
	results: number | null;
}

/** Every rule one test gets, one after another, as the form lists them. */
export function flatRules(test: ScopeTest, picks: ScopePicks): FlatRule[] {
	return writtenRules(test, picks).flatMap((entry): FlatRule[] => {
		const { parameters, tags } = entry;

		if (!entry.verdicts) {
			return [{ parameters, tags, verdicts: null, results: entry.results }];
		}

		return entry.verdicts.map((verdicts) => ({
			parameters,
			tags,
			verdicts,
			results: entry.rules === 1 ? entry.results : null
		}));
	});
}

/** Every verdict list the test's results failed with, each once. */
export function verdictListsOf(test: ScopeTest): string[][] {
	const lists: string[][] = [];

	for (const list of test.rules.flatMap((rule) => rule.verdicts)) {
		if (!lists.some((kept) => sameVerdicts(kept, list))) lists.push(list);
	}

	return lists;
}

/**
 * Where one test's rules would match more than the reader may expect: the
 * dimensions they do not narrow, because the results have no parameter,
 * every parameter was dropped or the verdicts were, each with a sentence
 * saying which.
 */
export interface TestStanding {
	/** Nothing but the path, and the tags if any, is kept. */
	pathOnly: boolean;
	/** The dimensions the rules do not narrow. */
	open: TestScopeField[];
	/** One sentence per thing the reader may not expect; none when narrowed. */
	warnings: string[];
}

export function testStanding(test: ScopeTest, picks: ScopePicks): TestStanding {
	const matchers = test.rules.map((rule) => matcherOfRule(rule, test, picks));
	const bare = matchers.filter(
		(matcher) => !Object.keys(matcher.parameters).length
	);
	// The verdicts are kept or dropped for the whole test.
	const anyVerdicts = matchers.some((matcher) => matcher.verdicts === null);
	const open: TestScopeField[] = [];

	if (bare.length) open.push('parameters');
	if (anyVerdicts) open.push('verdicts');

	const pathOnly = open.length === 2;
	// Not every rule is as wide as the widest, and the card warns of that one.
	const some = bare.length < matchers.length;

	if (pathOnly) {
		const untagged = bare.some((matcher) => !matcher.tags.length);
		const which = some ? 'One of the rules matches every' : 'Every';
		const verb = some ? '' : ' will match';

		return {
			pathOnly,
			open,
			warnings: [
				untagged
					? `${which} failure of this test${verb}: nothing but the path is kept.`
					: `${which} failure of this test in a run with the kept tags${verb}.`
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

			if (some) {
				return 'Any parameters will match one of the rules: it keeps none.';
			}

			return test.rules.some((rule) => !Object.keys(rule.parameters).length)
				? 'Any parameters will match: the selected results have none.'
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
