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

/**
 * What the reader kept of one rule. Each field is null until the reader
 * changes it, since its default is only known once the options arrive:
 * every parameter, the verdicts, and the important tags. The parameters are
 * kept by name. The verdicts are kept whole or not at all, as the server
 * matches them exactly.
 */
export interface RulePicks {
	parameters: string[] | null;
	verdicts: boolean | null;
	tags: string[] | null;
}

/**
 * What the reader kept, rule by rule: the options give the rules, and each
 * is narrowed on its own.
 */
export interface ScopePicks {
	/** By `ruleKey`; a rule not listed reads `fallback`. */
	rules: Record<string, RulePicks>;
	/**
	 * What an unlisted rule's fields hold: null for their defaults, empty
	 * once the section's bin emptied every field, which happens outside the
	 * match scope, before it may know the rules.
	 */
	fallback: RulePicks | null;
}

export const DEFAULT_SCOPE_PICKS: ScopePicks = { rules: {}, fallback: null };

/** Every field emptied: the rules match on their paths alone. */
export const CLEARED_SCOPE_PICKS: ScopePicks = {
	rules: {},
	fallback: { parameters: [], verdicts: false, tags: [] }
};

const UNTOUCHED: RulePicks = { parameters: null, verdicts: null, tags: null };

/** One value a field's list offers. */
export interface ScopeOption {
	value: string;
	label: string;
	/** An important tag of the runs, kept by default. */
	important: boolean;
}

/** What tells a rule of the options from the others: its test and runs. */
export function ruleKey(rule: ClassifyRuleOptions): string {
	return `${rule.test_id}:${rule.run_ids.join(',')}`;
}

/** How many tests the options' rules are of. */
export function testCount(options: ClassifyOptions): number {
	return new Set(options.map((rule) => rule.test_id)).size;
}

/** A parameter as a rule's matcher spells it, `key=value`. */
export function parameterValue(key: string, value: string): string {
	return `${key}${config.keyValueSubmitDelimiter}${value}`;
}

/** What a rule's Parameters field offers: the parameters its results share. */
export function parameterOptions(rule: ClassifyRuleOptions): ScopeOption[] {
	return Object.entries(rule.parameters)
		.sort(([left], [right]) => left.localeCompare(right))
		.map(([name, value]) => ({
			value: name,
			label: displayKeyValue(parameterValue(name, value)),
			important: false
		}));
}

/**
 * The tags a rule may take: the important ones first, then the relevant
 * ones, as the run page shows them.
 */
export function tagOptions(rule: ClassifyRuleOptions): ScopeOption[] {
	const important = new Set(rule.tags.default);

	return [
		...rule.tags.default,
		...rule.tags.allowed.filter((tag) => !important.has(tag))
	].map((tag) => ({
		value: tag,
		label: displayKeyValue(tag),
		important: important.has(tag)
	}));
}

function picksOf(picks: ScopePicks, rule: ClassifyRuleOptions): RulePicks {
	return picks.rules[ruleKey(rule)] ?? picks.fallback ?? UNTOUCHED;
}

/**
 * The parameter names a rule keeps: the reader's picks once they made any,
 * else every name. Picks the options no longer offer are dropped.
 */
export function parametersPicked(
	rule: ClassifyRuleOptions,
	picks: ScopePicks
): string[] {
	const offered = parameterOptions(rule).map((option) => option.value);
	const picked = picksOf(picks, rule).parameters;

	if (picked === null) return offered;

	const kept = new Set(picked);

	return offered.filter((value) => kept.has(value));
}

/** Whether a rule keeps its verdict lists; it does until they are dropped. */
export function verdictsKept(rule: ClassifyRuleOptions, picks: ScopePicks) {
	return picksOf(picks, rule).verdicts ?? true;
}

/** The tags a rule keeps: the reader's picks, else its important ones. */
export function tagsPicked(
	rule: ClassifyRuleOptions,
	picks: ScopePicks
): string[] {
	const picked = picksOf(picks, rule).tags;

	if (picked === null) return rule.tags.default;

	const kept = new Set(picked);

	return tagOptions(rule)
		.filter((option) => kept.has(option.value))
		.map((option) => option.value);
}

export function setRulePick(
	picks: ScopePicks,
	rule: ClassifyRuleOptions,
	next: Partial<RulePicks>
): ScopePicks {
	return {
		...picks,
		rules: {
			...picks.rules,
			[ruleKey(rule)]: { ...picksOf(picks, rule), ...next }
		}
	};
}

/** One rule back to its defaults, whatever the section's bin did to all. */
export function resetRulePicks(
	picks: ScopePicks,
	rule: ClassifyRuleOptions
): ScopePicks {
	return setRulePick(picks, rule, UNTOUCHED);
}

/** One rule emptied: it matches on its test's path alone. */
export function clearRulePicks(
	picks: ScopePicks,
	rule: ClassifyRuleOptions
): ScopePicks {
	return setRulePick(picks, rule, {
		parameters: [],
		verdicts: false,
		tags: []
	});
}

/**
 * The matcher of one of the options' rules: what the rule may contain, cut
 * down to the reader's picks. Emptied parameters or tags are sent empty, and
 * dropped verdicts null, which the endpoint reads as "do not match on it";
 * kept verdicts are every list the options gave, the only thing it accepts
 * besides null.
 */
export function matcherOfRule(
	rule: ClassifyRuleOptions,
	picks: ScopePicks
): ClassifyMatcher {
	const names = new Set(parametersPicked(rule, picks));

	return {
		test_id: rule.test_id,
		run_ids: rule.run_ids,
		parameters: Object.fromEntries(
			Object.entries(rule.parameters).filter(([name]) => names.has(name))
		),
		verdicts: verdictsKept(rule, picks) ? rule.verdicts : null,
		tags: tagsPicked(rule, picks)
	};
}

/** The matchers of a classify request: one per rule of the options. */
export function matchersFor(
	options: ClassifyOptions,
	picks: ScopePicks
): ClassifyMatcher[] {
	return options.map((rule) => matcherOfRule(rule, picks));
}

/** What a stored rule matches on, as a key: equal keys are one rule. */
function storedKeys(matcher: ClassifyMatcher): string[] {
	const base = [
		matcher.test_id,
		Object.entries(matcher.parameters).sort(([left], [right]) =>
			left.localeCompare(right)
		),
		[...matcher.tags].sort()
	];

	return (matcher.verdicts ?? [null]).map((verdicts) =>
		JSON.stringify([...base, verdicts])
	);
}

/**
 * How many rules the server writes per category: a matcher gives one per
 * verdict list kept, else one, and those that come out the same are one.
 */
export function rulesWritten(
	options: ClassifyOptions,
	picks: ScopePicks
): number {
	return new Set(
		options.flatMap((rule) => storedKeys(matcherOfRule(rule, picks)))
	).size;
}

/** How many rules one of the options' rules gives: one per verdict list kept. */
export function rulesOf(rule: ClassifyRuleOptions, picks: ScopePicks): number {
	return verdictsKept(rule, picks) ? Math.max(rule.verdicts.length, 1) : 1;
}

/**
 * Whether a rule now matches on exactly what an earlier one of the options
 * does: the server writes one rule for the two.
 */
export function sameAsEarlier(
	options: ClassifyOptions,
	index: number,
	picks: ScopePicks
): boolean {
	const own = storedKeys(matcherOfRule(options[index], picks)).join('\n');

	return options
		.slice(0, index)
		.some((rule) => storedKeys(matcherOfRule(rule, picks)).join('\n') === own);
}

/** The tags every rule may take: keeping one never tells the rules apart. */
export function sharedTags(options: ClassifyOptions): Set<string> {
	const [first, ...rest] = options.map(
		(rule) => new Set([...rule.tags.default, ...rule.tags.allowed])
	);

	return new Set(
		Array.from(first ?? []).filter((tag) => rest.every((tags) => tags.has(tag)))
	);
}

/** The kept tags only some of the rules may take, each once. */
export function tagsApart(options: ClassifyOptions, picks: ScopePicks) {
	const shared = sharedTags(options);

	return Array.from(
		new Set(options.flatMap((rule) => tagsPicked(rule, picks)))
	).filter((tag) => !shared.has(tag));
}

/** The picks with every rule keeping only the tags all of them may take. */
export function keepSharedTags(
	options: ClassifyOptions,
	picks: ScopePicks
): ScopePicks {
	const shared = sharedTags(options);

	return options.reduce(
		(next, rule) =>
			setRulePick(next, rule, {
				tags: tagsPicked(rule, picks).filter((tag) => shared.has(tag))
			}),
		picks
	);
}

/**
 * Where a rule would match more than the reader may expect: the dimensions
 * it does not narrow, because the results share no parameter, every
 * parameter was dropped or the verdicts were, each with a sentence saying
 * which.
 */
export interface RuleStanding {
	/** Nothing but the path, and the tags if any, is kept. */
	pathOnly: boolean;
	/** The dimensions the rule does not narrow. */
	open: Exclude<ScopeField, 'tags'>[];
	/** One sentence per thing the reader may not expect; none when narrowed. */
	warnings: string[];
}

export function ruleStanding(
	rule: ClassifyRuleOptions,
	picks: ScopePicks
): RuleStanding {
	const matcher = matcherOfRule(rule, picks);
	const open: RuleStanding['open'] = [];

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

			return Object.keys(rule.parameters).length
				? 'Any parameters will match: all were removed.'
				: 'Any parameters will match: the selected results share none.';
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
