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

const orderOf =
	<U extends string>() =>
	<T extends readonly U[]>(
		tuple: T & (Exclude<U, T[number]> extends never ? T : never)
	): readonly U[] =>
		tuple;

const STRIPE_GREEN = 'bg-bg-ok text-white';
const STRIPE_ORANGE = 'bg-bg-warning text-white';
const STRIPE_RED = 'bg-bg-error text-white';
const STRIPE_VIOLET = 'bg-bg-triage text-white';
const STRIPE_GREY = 'bg-bg-compromised text-white';

export const CLASSIFICATION_BADGE_CLASS =
	'text-[0.6875rem] leading-[1.125rem] uppercase tracking-wide';

export const RESULT_VERDICT_CHIP_CLASS = 'min-w-[86px] justify-center';

export interface CategoryMeta {
	value: IssueCategory;
	label: string;
	displayValue: string;
	description: string;
	variant: BadgeVariants;
	iconName: IconName;
}

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

export type RunIssueEffect = 'suppressed' | 'stale' | 'unexpected' | 'marked';

export interface RunIssueEffectMeta {
	value: RunIssueEffect;
	label: string;
	displayValue: string;
	description: string;
	variant: BadgeVariants;
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

export const NO_EFFECT_META = {
	value: 'no-effect',
	label: 'No effect',
	displayValue: 'No effect',
	description:
		'The result passed, so its stamps decide nothing. They record that a rule matches this iteration, not that anything went wrong this time.',
	variant: BadgeVariants.Outline,
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

export type ResultClassification = RunIssueEffect | 'untriaged' | 'no-effect';

export type ResultClassificationMeta =
	| RunIssueEffectMeta
	| typeof UNTRIAGED_META
	| typeof NO_EFFECT_META;

export const RESULT_CLASSIFICATION_ORDER = orderOf<ResultClassification>()([
	'untriaged',
	'suppressed',
	'stale',
	'unexpected',
	'marked',
	'no-effect'
] as const);

export function resultClassification(input: {
	issues?: readonly Pick<ResultIssueRef, 'expected' | 'issue_state'>[];
	hasError: boolean;
}): ResultClassificationMeta | null {
	const stamps = input.issues ?? [];

	if (!stamps.length) return input.hasError ? UNTRIAGED_META : null;

	return input.hasError ? resultIssueEffect(stamps) : NO_EFFECT_META;
}

export type Disposition = 'expected' | 'unexpected' | 'none';

export interface DispositionMeta {
	value: Disposition;
	label: string;
	description: string;
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

export function aggregateExpected(
	categories: RunIssueRow['categories']
): boolean | null {
	if (categories.some((c) => c.expected === true)) return true;
	if (categories.some((c) => c.expected === false)) return false;
	return null;
}

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

export function resultIssueEffect(
	issues: readonly Pick<ResultIssueRef, 'expected' | 'issue_state'>[]
): RunIssueEffectMeta {
	const isExpected = (i: (typeof issues)[number]) => i.expected === true;

	if (issues.some((i) => isExpected(i) && i.issue_state === 'open')) {
		return RUN_ISSUE_EFFECT_META.suppressed;
	}

	if (issues.some((i) => isExpected(i) && i.issue_state === 'closed')) {
		return RUN_ISSUE_EFFECT_META.stale;
	}

	if (issues.some((i) => i.expected === false)) {
		return RUN_ISSUE_EFFECT_META.unexpected;
	}

	return RUN_ISSUE_EFFECT_META.marked;
}

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

export const DESTRUCTIVE_FILL_CLASS = 'bg-red-100 hover:bg-red-200';
