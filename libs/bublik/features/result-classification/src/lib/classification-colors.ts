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

/**
 * The verdict chip on a result line is boxed to one width, so the Classify
 * button trailing it lands at the same offset on every row instead of stepping
 * left and right as the label changes.
 *
 * Sized to the longest of the six labels, SUPPRESSED, with slack for a font
 * that renders wider than measured: a label that outgrows the box takes its own
 * row back out of line, which is the one thing this exists to prevent. Centred,
 * so the room a short label like AGAIN gains is shared rather than hanging off
 * one end.
 */
export const RESULT_VERDICT_CHIP_CLASS = 'min-w-[86px] justify-center';

export interface CategoryMeta {
	value: IssueCategory;
	/** Short form, for chips inside a table cell. */
	label: string;
	/** Long form, for filter lists and tooltips. */
	displayValue: string;
	description: string;
	/**
	 * The chip's whole appearance -- wash, ink, hover preview and selected
	 * outline -- in one token, so a selected chip outlines in its own hue rather
	 * than a house blue. See `BadgeVariants`.
	 */
	variant: BadgeVariants;
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
		variant: BadgeVariants.Unexpected,
		iconName: 'InformationCircleCrossMark'
	},
	'test-bug': {
		value: 'test-bug',
		label: 'Test Bug',
		displayValue: 'Test/automation bug',
		description: 'A bug in the test or the automation, not in the product.',
		variant: BadgeVariants.Warning,
		iconName: 'InformationCircleExclamationMark'
	},
	env: {
		value: 'env',
		label: 'Env',
		displayValue: 'Environment / infra',
		description: 'Caused by the environment or the infrastructure.',
		variant: BadgeVariants.Env,
		iconName: 'InformationCircleForbidden'
	},
	'known-issue': {
		value: 'known-issue',
		label: 'Known',
		displayValue: 'Known issue',
		description: 'A known, already-triaged failure.',
		variant: BadgeVariants.Info,
		iconName: 'InformationCircleCheckmark'
	},
	flaky: {
		value: 'flaky',
		label: 'Flaky',
		displayValue: 'Flaky / intermittent',
		description: 'Passes and fails without a change in the product.',
		variant: BadgeVariants.Caution,
		iconName: 'InformationCircleProgress'
	},
	'to-investigate': {
		value: 'to-investigate',
		label: 'Investigate',
		displayValue: 'To investigate',
		description: 'Noted, but nobody has worked out the cause yet.',
		variant: BadgeVariants.Triage,
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
			variant: BadgeVariants.Neutral,
			iconName: 'InformationCircleQuestionMark'
		}
	);
}

export interface IssueStateMeta {
	label: string;
	description: string;
	variant: BadgeVariants;
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
			variant: BadgeVariants.Warning,
			iconName: 'InformationCircleStop'
		};
	}

	return {
		label: 'Open',
		description: 'Issue is open — its rules are in force for this run.',
		variant: BadgeVariants.Expected,
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
	/**
	 * Short form, for chips inside a table cell. Kept to one word wherever one
	 * will do: this chip rides beside a result badge on every row of a run, and
	 * a wide chip is a scanning hazard. What the word means lives in the
	 * tooltip, as it does for every other chip in the system.
	 */
	label: string;
	/** Long form, for filter lists and tooltips, where there is room. */
	displayValue: string;
	description: string;
	variant: BadgeVariants;
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
			displayValue: 'Suppressed',
			description:
				'Does not count as unexpected: at least one rule marks these results expected, and the issue is open.',
			variant: BadgeVariants.Expected,
			stripeClassName: STRIPE_GREEN,
			iconName: 'EyeHide'
		},
		stale: {
			value: 'stale',
			// The whole of "counting again" is in the word that changed: these
			// results were suppressed, and now they are not.
			label: 'Again',
			displayValue: 'Counting again',
			description:
				'Counts as unexpected again: these results were suppressed, but closing the issue un-suppressed them.',
			variant: BadgeVariants.Warning,
			stripeClassName: STRIPE_ORANGE,
			iconName: 'InformationCircleStop'
		},
		unexpected: {
			value: 'unexpected',
			/*
			 * Not "Unexpected": that word already names the verdict axis — the
			 * Expected/Obtained columns and the toolbar counters — and a chip
			 * beside a result badge repeating it asks the reader to work out
			 * which of the two questions it is answering.
			 */
			label: 'Counts',
			displayValue: 'Still counts',
			description:
				'Counts as unexpected: the rules explain these results, but still call them a real failure.',
			variant: BadgeVariants.Unexpected,
			stripeClassName: STRIPE_RED,
			iconName: 'InformationCircleCrossMark'
		},
		marked: {
			value: 'marked',
			label: 'Undecided',
			displayValue: 'Undecided',
			description:
				'Counts as unexpected: the rules stamp these results but set no disposition, so nothing was decided and nothing is suppressed.',
			variant: BadgeVariants.Triage,
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
	displayValue: 'Untriaged',
	description:
		'Counts as unexpected: nobody has classified this failure, so no rule explains it.',
	variant: BadgeVariants.Triage,
	stripeClassName: STRIPE_VIOLET,
	iconName: 'TriangleExclamationMark'
} as const satisfies {
	value: string;
	label: string;
	displayValue: string;
	description: string;
	variant: BadgeVariants;
	stripeClassName: string;
	iconName: IconName;
};

/**
 * A result that passed but carries stamps anyway.
 *
 * Outside `RunIssueEffect` for the same reason as `UNTRIAGED_META`: that union
 * answers what the rules did to the unexpected count, and here they did
 * nothing, because there was no failure for them to act on. Running
 * `resultIssueEffect` over these stamps would answer confidently and wrongly —
 * a rule marked `expected` would report SUPPRESSED, claiming to have hidden a
 * failure that never happened.
 *
 * It is worth a chip rather than a blank. The stamps below it need explaining
 * — a known-broken test that passed this time is a fact you want to see — and
 * an empty slot where every other row carries a verdict reads as something
 * failing to render.
 *
 * `BadgeVariants.Outline` -- the only hollow chip in the system.
 * The five hue families all assert something about the count, and this one has
 * nothing to assert — but the sixth, grey, is already spoken for: it is the
 * identity hue, worn by the key chip directly beneath this one, so a grey
 * verdict and the key it sits above read as the same kind of thing. An empty
 * outline says "no verdict" in the one register nothing else uses.
 *
 * The label keeps the primary text colour. Muting it as well would say the
 * chip is of secondary importance, when it is the row's verdict like any
 * other; the outline already carries the whole of what is different here.
 */
export const NO_EFFECT_META = {
	value: 'no-effect',
	label: 'No effect',
	displayValue: 'No effect',
	description:
		'The result passed, so its stamps decide nothing. They record that a rule matches this iteration, not that anything went wrong this time.',
	variant: BadgeVariants.Outline,
	// The stripe has no key chip beside it to be confused with, and a hollow
	// 24px gutter would read as a rendering gap, so there it stays grey.
	stripeClassName: STRIPE_GREY,
	iconName: 'InformationCircleForbidden'
} as const satisfies {
	value: string;
	label: string;
	displayValue: string;
	description: string;
	variant: BadgeVariants;
	stripeClassName: string;
	iconName: IconName;
};

/**
 * The verdict a single result carries: one closed set spanning the three cases
 * the result line has to distinguish.
 *
 * `RunIssueEffect` alone cannot answer it. That union asks what the rules did
 * to the unexpected count, which presumes rules ran and a failure for them to
 * act on -- and the two most common rows on a run page satisfy neither. This
 * adds them back: `untriaged` for a failure nobody has looked at, `no-effect`
 * for a pass whose stamps decided nothing.
 */
export type ResultClassification = RunIssueEffect | 'untriaged' | 'no-effect';

export type ResultClassificationMeta =
	| RunIssueEffectMeta
	| typeof UNTRIAGED_META
	| typeof NO_EFFECT_META;

/**
 * Display order for the classification facet.
 *
 * `EFFECT_ORDER` in the middle, untouched, with the two outsiders at the ends
 * where they belong: nobody has looked yet, then the four things the rules
 * decided, then the rows where there was nothing to decide.
 */
export const RESULT_CLASSIFICATION_ORDER = orderOf<ResultClassification>()([
	'untriaged',
	'suppressed',
	'stale',
	'unexpected',
	'marked',
	'no-effect'
] as const);

/**
 * The verdict for one result, from the two facts that decide it.
 *
 * The single source of truth for the chip, the filter and the facet options:
 * a chip the reader can click to filter has to agree with the predicate that
 * filters, and this is the branch they now share. `null` means the result has
 * no verdict to show -- it passed and carries no stamps -- which is a row the
 * filter must never match rather than a sixth value.
 */
export function resultClassification(input: {
	issues?: readonly Pick<ResultIssueRef, 'expected' | 'issue_state'>[];
	hasError: boolean;
}): ResultClassificationMeta | null {
	const stamps = input.issues ?? [];

	if (!stamps.length) return input.hasError ? UNTRIAGED_META : null;

	return input.hasError ? resultIssueEffect(stamps) : NO_EFFECT_META;
}

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
	variant: BadgeVariants;
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
		variant: BadgeVariants.Expected,
		stripeClassName: STRIPE_GREEN,
		iconName: 'InformationCircleCheckmark'
	},
	dormant: {
		value: 'dormant',
		label: 'No active rules',
		description:
			'The issue is open but none of its rules are active. Reopening an issue does not re-activate the rules that closing it deactivated — enable them by hand.',
		variant: BadgeVariants.Triage,
		stripeClassName: STRIPE_VIOLET,
		iconName: 'TriangleQuestionMark'
	},
	deactivated: {
		value: 'deactivated',
		label: 'Deactivated',
		description:
			'Closing the issue deactivated its rules, so nothing new will be matched to it.',
		variant: BadgeVariants.Warning,
		stripeClassName: STRIPE_ORANGE,
		iconName: 'InformationCircleStop'
	},
	unruled: {
		value: 'unruled',
		label: 'No rules',
		description:
			'This issue has no rules yet. Rules are created by classifying a result, never on their own.',
		variant: BadgeVariants.Neutral,
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
			variant: BadgeVariants.Expected,
			stripeClassName: STRIPE_GREEN,
			iconName: 'InformationCircleCheckmark'
		};
	}

	return {
		value: 'deactivated',
		label: 'Inactive',
		description:
			'This rule matches nothing new. Existing stamps it already laid down are left alone.',
		variant: BadgeVariants.Neutral,
		// Grey, matching the chip. A deactivated rule is a deliberate state, not a
		// failure, and an orange gutter over a grey chip made the row say two
		// different things about the same rule.
		stripeClassName: STRIPE_GREY,
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
