/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { BadgeVariants } from '@/shared/tailwind-ui';
import type { IssueCategory } from '@/shared/types';

import {
	STRIPE_GREEN,
	STRIPE_GREY,
	STRIPE_ORANGE,
	STRIPE_RED,
	STRIPE_VIOLET,
	orderOf,
	type IconName
} from './classification.tokens';
import type {
	CategoryMeta,
	DispositionMeta,
	Disposition,
	IssueRulesState,
	IssueRulesStateMeta,
	OriginMeta,
	RuleResultOrigin,
	RunIssueEffect,
	RunIssueEffectMeta
} from './classification.types';

export const CLASSIFICATION_BADGE_CLASS =
	'text-[0.6875rem] leading-[1.125rem] uppercase tracking-wide';

export const RESULT_VERDICT_CHIP_CLASS = 'min-w-[86px] justify-center';

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

export const DESTRUCTIVE_FILL_CLASS = 'bg-red-100 hover:bg-red-200';
