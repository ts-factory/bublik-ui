/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { BadgeVariants } from '@/shared/tailwind-ui';
import type { IconProps } from '@/shared/tailwind-ui';
import type {
	IssueCategory,
	IssueState,
	ResultIssueRef,
	RunIssueRow
} from '@/shared/types';

type IconName = IconProps['name'];

/**
 * Builds an ordering tuple that the compiler checks for completeness.
 *
 * The order arrays below are the display order for chips and facet lists, and
 * they are hand-written, so nothing but this stops one from drifting out of
 * step with its meta map. Miss a member and the call is a type error rather
 * than a value that silently vanishes from every filter dropdown.
 */
const orderOf =
	<U extends string>() =>
	<T extends readonly U[]>(
		tuple: T & (Exclude<U, T[number]> extends never ? T : never)
	): readonly U[] =>
		tuple;

/**
 * Colour policy for classification, in one place.
 *
 * Red/orange means *known bad*, green means *accepted*, and violet means
 * *nobody has decided yet*. The violet family exists precisely so a row that
 * still needs a human does not disappear into a wall of red failures.
 */

/**
 * Classification chips live in dense table cells, so they keep the standard
 * Badge box and only shrink the label, which is uppercased to read as a status
 * rather than as content. The meaning lives in the tooltip, not in an icon.
 */
/**
 * Solid fills for the status stripe — column 0 of every classification table.
 *
 * The chip washes (`badge-*`, 88-98% lightness) are tuned to sit behind text at
 * chip size; in a 24px block of pure colour they read as an off-white smudge.
 * These are the same five meanings in the saturated tokens, so a row's hue
 * tells the same story whether you read it in the stripe or in the chips.
 */
const STRIPE_GREEN = 'bg-bg-ok text-white';
const STRIPE_ORANGE = 'bg-bg-warning text-white';
const STRIPE_RED = 'bg-bg-error text-white';
const STRIPE_VIOLET = 'bg-bg-triage text-white';
const STRIPE_GREY = 'bg-bg-compromised text-white';

export const CLASSIFICATION_BADGE_CLASS =
	'text-[0.6875rem] leading-[1.125rem] uppercase tracking-wide';

export interface CategoryMeta {
	value: IssueCategory;
	/** Short form, for chips inside a table cell. */
	label: string;
	/** Long form, for filter lists and tooltips. */
	displayValue: string;
	description: string;
	className: string;
	iconName: IconName;
}

/**
 * Mirrors the backend's `_EXPECTED_BY_CATEGORY` policy table. Shown as the
 * category's *default* disposition; the rule's own `expected` still wins.
 *
 * `label` is the chip text and stays short — it is uppercased by the chip
 * shell, and a wide chip is a scanning hazard. The self-explanatory long form
 * lives in `displayValue` for the classify form and facet filters.
 */
export const CATEGORY_META: Record<IssueCategory, CategoryMeta> = {
	'product-defect': {
		value: 'product-defect',
		label: 'Defect',
		displayValue: 'Product defect',
		description:
			'A real defect in the product under test. Counts as unexpected.',
		className: 'bg-badge-13 text-text-unexpected',
		iconName: 'InformationCircleCrossMark'
	},
	'test-bug': {
		value: 'test-bug',
		label: 'Test Bug',
		displayValue: 'Test/automation bug',
		description: 'A bug in the test or the automation, not in the product.',
		className: 'bg-badge-14 text-text-primary',
		iconName: 'InformationCircleExclamationMark'
	},
	env: {
		value: 'env',
		label: 'Env',
		displayValue: 'Environment / infra',
		description: 'Caused by the environment or the infrastructure.',
		className: 'bg-badge-7 text-text-primary',
		iconName: 'InformationCircleForbidden'
	},
	'known-issue': {
		value: 'known-issue',
		label: 'Known',
		displayValue: 'Known issue',
		description: 'A known, already-triaged failure.',
		className: 'bg-badge-1 text-text-primary',
		iconName: 'InformationCircleCheckmark'
	},
	flaky: {
		value: 'flaky',
		label: 'Flaky',
		displayValue: 'Flaky / intermittent',
		description: 'Passes and fails without a change in the product.',
		className: 'bg-badge-17 text-text-primary',
		iconName: 'InformationCircleProgress'
	},
	'to-investigate': {
		value: 'to-investigate',
		label: 'Investigate',
		displayValue: 'To investigate',
		description: 'Noted, but nobody has worked out the cause yet.',
		className: 'bg-badge-2 text-text-triage',
		iconName: 'TriangleQuestionMark'
	}
};

export const CATEGORY_ORDER = orderOf<IssueCategory>()([
	'product-defect',
	'test-bug',
	'env',
	'known-issue',
	'flaky',
	'to-investigate'
] as const);

export function categoryMeta(category: IssueCategory): CategoryMeta {
	return (
		CATEGORY_META[category] ?? {
			value: category,
			label: category,
			displayValue: category,
			description: 'Unknown category',
			className: 'bg-badge-0 text-text-primary',
			iconName: 'InformationCircleQuestionMark'
		}
	);
}

export interface IssueStateMeta {
	label: string;
	description: string;
	className: string;
	iconName: IconName;
}

/**
 * Closing an issue is not archiving it: it deactivates the issue's rules and
 * un-suppresses every result they were hiding, so those failures start
 * counting again. That is the surprising half, so it gets the loud colour.
 */
export function issueStateMeta(state: IssueState): IssueStateMeta {
	if (state === 'closed') {
		return {
			label: 'Closed',
			description:
				'Issue is closed — its results are no longer suppressed and count as unexpected again.',
			className: 'bg-badge-14 text-text-primary',
			iconName: 'InformationCircleStop'
		};
	}

	return {
		label: 'Open',
		description: 'Issue is open — its rules are in force for this run.',
		className: 'bg-badge-3 text-text-expected',
		iconName: 'InformationCircleCheckmark'
	};
}

/**
 * Whether this issue's results still count as unexpected in this run.
 *
 * The four values are the answers to that one question — one "no", and three
 * different "yes"es that differ only in *why*. The stored values are part of
 * the run page's filter URL, so they are frozen; only the labels are free to
 * change.
 *
 * The backend suppresses a result when *any* stamp has `expected=true` on an
 * open issue, so the aggregate is an OR, not a majority — and a closed issue
 * suppresses nothing regardless of its rules.
 */
export type RunIssueEffect = 'suppressed' | 'stale' | 'unexpected' | 'marked';

export interface RunIssueEffectMeta {
	value: RunIssueEffect;
	label: string;
	description: string;
	className: string;
	/**
	 * Solid fill for the status stripe, where the pale chip wash reads as no
	 * colour at all. Carries its own text colour: the stripe holds an icon, not
	 * a label, and it sits on saturated ground rather than a wash.
	 */
	stripeClassName: string;
	iconName: IconName;
}

export const RUN_ISSUE_EFFECT_META: Record<RunIssueEffect, RunIssueEffectMeta> =
	{
		suppressed: {
			value: 'suppressed',
			label: 'Suppressed',
			description:
				'Does not count as unexpected: at least one rule marks these results expected, and the issue is open.',
			className: 'bg-badge-3 text-text-expected',
			stripeClassName: STRIPE_GREEN,
			iconName: 'EyeHide'
		},
		stale: {
			value: 'stale',
			label: 'Counting again',
			description:
				'Counts as unexpected again: these results were suppressed, but closing the issue un-suppressed them.',
			className: 'bg-badge-14 text-text-primary',
			stripeClassName: STRIPE_ORANGE,
			iconName: 'InformationCircleStop'
		},
		unexpected: {
			value: 'unexpected',
			label: 'Still counts',
			/*
			 * Not "Unexpected": that word already names the verdict axis — the
			 * Expected/Obtained columns and the toolbar counters — and a chip
			 * repeating it under a result badge asks the reader to work out
			 * which of the two questions it is answering.
			 */
			description:
				'Counts as unexpected: the rules explain these results, but still call them a real failure.',
			className: 'bg-badge-13 text-text-unexpected',
			stripeClassName: STRIPE_RED,
			iconName: 'InformationCircleCrossMark'
		},
		marked: {
			value: 'marked',
			label: 'Undecided',
			description:
				'Counts as unexpected: the rules stamp these results but set no disposition, so nothing was decided and nothing is suppressed.',
			className: 'bg-badge-2 text-text-triage',
			stripeClassName: STRIPE_VIOLET,
			iconName: 'TriangleQuestionMark'
		}
	};

export const EFFECT_ORDER = orderOf<RunIssueEffect>()([
	'suppressed',
	'stale',
	'unexpected',
	'marked'
] as const);

/**
 * A failing result nobody has classified at all.
 *
 * Kept out of `RunIssueEffect` on purpose. That union answers "what did the
 * rules do to the count?" and its values are frozen into the run page's filter
 * URL; this is the prior question of whether any rule ran, and a run-issue row
 * — which exists only because a rule matched — can never be untriaged.
 *
 * Violet, like `marked`, because both mean "needs a human". They never appear
 * together: `marked` is someone deciding nothing, this is nobody looking.
 * The icon matches the Untriaged checkbox in the history search form and its
 * filter-legend pill, so the badge and the control that finds it agree.
 */
export const UNTRIAGED_META = {
	value: 'untriaged',
	label: 'Untriaged',
	description:
		'Counts as unexpected: nobody has classified this failure, so no rule explains it.',
	className: 'bg-badge-2 text-text-triage',
	stripeClassName: STRIPE_VIOLET,
	iconName: 'TriangleExclamationMark'
} as const satisfies {
	value: string;
	label: string;
	description: string;
	className: string;
	stripeClassName: string;
	iconName: IconName;
};

/**
 * The disposition axis: what a rule's tri-state `expected` decides.
 *
 * `null` is not "unknown pending a value" — it is a deliberate third choice
 * that stamps the result and changes no count, and it is the classify form's
 * default, so it is the disposition you see most often.
 */
export type Disposition = 'expected' | 'unexpected' | 'none';

export interface DispositionMeta {
	value: Disposition;
	label: string;
	/** Reads as one rule's decision, for `/issues/:issueId`. */
	description: string;
	/** Reads as an OR over several rules, for the per-issue row. */
	aggregateDescription: string;
	variant: BadgeVariants;
	iconName: IconName;
}

export const DISPOSITION_META: Record<Disposition, DispositionMeta> = {
	expected: {
		value: 'expected',
		label: 'Expected',
		description:
			'Results matching this rule stop counting as unexpected, as long as the issue stays open.',
		aggregateDescription:
			'At least one rule marks these results expected, so they stop counting while the issue is open.',
		variant: BadgeVariants.Expected,
		iconName: 'EyeHide'
	},
	unexpected: {
		value: 'unexpected',
		label: 'Unexpected',
		description:
			'Results matching this rule are explained but still count as unexpected.',
		aggregateDescription:
			'The rules explain these results but still call them unexpected, so they keep counting.',
		variant: BadgeVariants.Unexpected,
		iconName: 'InformationCircleCrossMark'
	},
	none: {
		value: 'none',
		label: 'Marked',
		description: 'This rule only marks results \u2014 it changes no count.',
		aggregateDescription:
			'The rules set no disposition, so the results are marked and nothing is suppressed.',
		variant: BadgeVariants.Triage,
		iconName: 'TriangleQuestionMark'
	}
};

export const DISPOSITION_ORDER = orderOf<Disposition>()([
	'expected',
	'unexpected',
	'none'
] as const);

/** The tri-state `expected` flag, as the key its meta is stored under. */
export function dispositionKey(
	expected: boolean | null | undefined
): Disposition {
	if (expected === true) return 'expected';
	if (expected === false) return 'unexpected';
	return 'none';
}

export function dispositionMeta(
	expected: boolean | null | undefined
): DispositionMeta {
	return DISPOSITION_META[dispositionKey(expected)];
}

/**
 * OR over the issue's rules, matching the backend's suppression filter:
 * any `expected=true` wins, otherwise any `expected=false`, otherwise none.
 */
export function aggregateExpected(
	categories: RunIssueRow['categories']
): boolean | null {
	if (categories.some((c) => c.expected === true)) return true;
	if (categories.some((c) => c.expected === false)) return false;
	return null;
}

/** One disposition against one issue state. The shared core of the two below. */
export function effectFor(
	expected: boolean | null,
	state: IssueState
): RunIssueEffectMeta {
	if (expected === true) {
		return state === 'open'
			? RUN_ISSUE_EFFECT_META.suppressed
			: RUN_ISSUE_EFFECT_META.stale;
	}

	if (expected === false) return RUN_ISSUE_EFFECT_META.unexpected;

	return RUN_ISSUE_EFFECT_META.marked;
}

export function runIssueEffect(issue: RunIssueRow): RunIssueEffectMeta {
	return effectFor(aggregateExpected(issue.categories), issue.state);
}

/**
 * The effect of *all* the stamps on one result.
 *
 * Deliberately not `effectFor(aggregateExpected(...), state)`: a result's
 * stamps can span several issues in different states, and there is no single
 * state to pass. The backend's `SUPPRESSION_FILTER` pairs `expected` with the
 * issue's state on the *same* stamp, so the pairing has to survive here too —
 * ORing the flags first and applying a state afterwards would report an open
 * `expected=false` stamp plus a closed `expected=true` one as suppressed,
 * when the backend counts it.
 */
export function resultIssueEffect(
	issues: readonly Pick<ResultIssueRef, 'expected' | 'issue_state'>[]
): RunIssueEffectMeta {
	const isExpected = (i: (typeof issues)[number]) => i.expected === true;

	if (issues.some((i) => isExpected(i) && i.issue_state === 'open')) {
		return RUN_ISSUE_EFFECT_META.suppressed;
	}

	// Would have suppressed, but the issue was closed. Worth its own word:
	// closing an issue silently makes its failures count again.
	if (issues.some((i) => isExpected(i) && i.issue_state === 'closed')) {
		return RUN_ISSUE_EFFECT_META.stale;
	}

	if (issues.some((i) => i.expected === false)) {
		return RUN_ISSUE_EFFECT_META.unexpected;
	}

	return RUN_ISSUE_EFFECT_META.marked;
}

/**
 * Whether an issue's rules are actually doing anything.
 *
 * `dormant` is the one that matters: `reopen` is not the inverse of `close`.
 * Closing an issue deactivates its rules, and reopening it does *not* switch
 * them back on, so a reopened issue silently stops matching anything.
 */
export type IssueRulesState =
	| 'enforced'
	| 'dormant'
	| 'deactivated'
	| 'unruled';

export interface IssueRulesStateMeta {
	value: IssueRulesState;
	label: string;
	description: string;
	className: string;
	/**
	 * Solid fill for the status stripe, where the pale chip wash reads as no
	 * colour at all. Carries its own text colour: the stripe holds an icon, not
	 * a label, and it sits on saturated ground rather than a wash.
	 */
	stripeClassName: string;
	iconName: IconName;
}

export const ISSUE_RULES_STATE_META: Record<
	IssueRulesState,
	IssueRulesStateMeta
> = {
	enforced: {
		value: 'enforced',
		label: 'Active',
		description:
			'This issue has active rules, so future imports will keep matching results to it.',
		className: 'bg-badge-3 text-text-expected',
		stripeClassName: STRIPE_GREEN,
		iconName: 'InformationCircleCheckmark'
	},
	dormant: {
		value: 'dormant',
		label: 'No active rules',
		description:
			'The issue is open but none of its rules are active. Reopening an issue does not re-activate the rules that closing it deactivated — enable them by hand.',
		className: 'bg-badge-2 text-text-triage',
		stripeClassName: STRIPE_VIOLET,
		iconName: 'TriangleQuestionMark'
	},
	deactivated: {
		value: 'deactivated',
		label: 'Deactivated',
		description:
			'Closing the issue deactivated its rules, so nothing new will be matched to it.',
		className: 'bg-badge-14 text-text-primary',
		stripeClassName: STRIPE_ORANGE,
		iconName: 'InformationCircleStop'
	},
	unruled: {
		value: 'unruled',
		label: 'No rules',
		description:
			'This issue has no rules yet. Rules are created by classifying a result, never on their own.',
		className: 'bg-badge-0 text-text-menu',
		stripeClassName: STRIPE_GREY,
		iconName: 'InformationCircleQuestionMark'
	}
};

export const RULES_STATE_ORDER = orderOf<IssueRulesState>()([
	'enforced',
	'dormant',
	'deactivated',
	'unruled'
] as const);

/**
 * A single rule's lifecycle flag. Inactive is grey, not red: a deactivated
 * rule is a deliberate state, not a failure.
 */
export function ruleActiveMeta(active: boolean): IssueRulesStateMeta {
	if (active) {
		return {
			value: 'enforced',
			label: 'Active',
			description: 'This rule is applied to every future import.',
			className: 'bg-badge-3 text-text-expected',
			stripeClassName: STRIPE_GREEN,
			iconName: 'InformationCircleCheckmark'
		};
	}

	return {
		value: 'deactivated',
		label: 'Inactive',
		description:
			'This rule matches nothing new. Existing stamps it already laid down are left alone.',
		className: 'bg-badge-0 text-text-menu',
		stripeClassName: STRIPE_ORANGE,
		iconName: 'InformationCircleStop'
	};
}

export function issueRulesState(input: {
	state: IssueState;
	total: number;
	active: number;
}): IssueRulesStateMeta {
	const { state, total, active } = input;

	if (total === 0) return ISSUE_RULES_STATE_META.unruled;
	if (active > 0) return ISSUE_RULES_STATE_META.enforced;

	return state === 'closed'
		? ISSUE_RULES_STATE_META.deactivated
		: ISSUE_RULES_STATE_META.dormant;
}

/** Strips the `ref://TRACKER/` prefix so chips show `FOO-123`, not the URI. */
export function formatBugKey(bugKey: string | null): string | null {
	if (!bugKey) return null;
	const match = /^ref:\/\/[^/\s]+\/(.+)$/.exec(bugKey);
	return match ? match[1] : bugKey;
}

export type RuleResultOrigin = ResultIssueRef['origin'];

export interface OriginMeta {
	value: RuleResultOrigin;
	label: string;
	description: string;
}

/**
 * Where a stamp came from. Deliberately not a chip: origin explains *who laid
 * the stamp*, which matters only when a stamp looks wrong, so it lives in
 * tooltips rather than adding a fourth badge to a history row.
 */
export const ORIGIN_META: Record<RuleResultOrigin, OriginMeta> = {
	import: {
		value: 'import',
		label: 'Import',
		description: 'Stamped automatically when the run was imported.'
	},
	manual_persistent: {
		value: 'manual_persistent',
		label: 'Manual',
		description:
			'Stamped by hand — also applies to matching results in future imports.'
	},
	manual_oneoff: {
		value: 'manual_oneoff',
		label: 'One-off',
		description: 'Stamped by hand — applies to this result only.'
	}
};

export function originMeta(origin: RuleResultOrigin): OriginMeta {
	return (
		ORIGIN_META[origin] ?? {
			value: origin,
			label: origin,
			description: 'Unknown stamp origin.'
		}
	);
}
