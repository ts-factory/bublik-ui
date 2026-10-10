/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { BadgeVariants } from '@/shared/tailwind-ui';
import type {
	IssueCategory,
	IssueState,
	ResultIssueRef,
	RuleEffect,
	RunIssueRow
} from '@/shared/types';

import {
	CATEGORY_META,
	DISPOSITION_META,
	NO_EFFECT_META,
	ORIGIN_META,
	RUN_ISSUE_EFFECT_META,
	UNTRIAGED_META,
	type ResultClassificationMeta
} from './classification.constants';
import { STRIPE_GREEN, STRIPE_GREY } from './classification.tokens';
import type {
	CategoryMeta,
	Disposition,
	DispositionMeta,
	IssueRulesStateMeta,
	IssueStateMeta,
	OriginMeta,
	RuleResultOrigin,
	RunIssueEffectMeta
} from './classification.types';

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

export function resultClassification(input: {
	issues?: readonly Pick<ResultIssueRef, 'expected' | 'issue_state'>[];
	hasError: boolean;
	/**
	 * The server's own verdict on whether an expected classification is holding
	 * this failure out of the unexpected counts.
	 *
	 * It has to be asked for separately, because `has_error` is *already*
	 * suppressed upstream — `is_result_unexpected` returns false as soon as a
	 * suppressing stamp exists. Read from `has_error` alone, a suppressed
	 * failure is indistinguishable from a pass that happens to carry a stamp,
	 * and comes out `no-effect`: the one state that says the classification did
	 * nothing. Where the field is served, it decides.
	 */
	effectiveExpected?: boolean;
}): ResultClassificationMeta | null {
	const stamps = input.issues ?? [];

	if (input.effectiveExpected) return RUN_ISSUE_EFFECT_META.suppressed;

	if (!stamps.length) return input.hasError ? UNTRIAGED_META : null;

	return input.hasError ? resultIssueEffect(stamps) : NO_EFFECT_META;
}

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

/** Strongest first: the effect a row with several rules reports as its own. */
const EFFECT_PRECEDENCE: readonly RuleEffect[] = [
	'suppressed',
	'stale',
	'unexpected',
	'marked'
];

/**
 * The run-level effect of an issue, from the per-rule `effect` the server
 * computes (`effect_for()`) — so the table and the run stats can't disagree on
 * what a rule does. An issue with rules that disagree reports the strongest.
 */
export function runIssueEffect(
	issue: Pick<RunIssueRow, 'rules'>
): RunIssueEffectMeta {
	const effects = new Set(issue.rules.map((rule) => rule.effect));
	const effect =
		EFFECT_PRECEDENCE.find((candidate) => effects.has(candidate)) ?? 'marked';

	return RUN_ISSUE_EFFECT_META[effect];
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

export function formatBugKey(bugKey: string | null): string | null {
	if (!bugKey) return null;
	const match = /^ref:\/\/[^/\s]+\/(.+)$/.exec(bugKey);
	return match ? match[1] : bugKey;
}

export function originMeta(origin: RuleResultOrigin): OriginMeta {
	return (
		ORIGIN_META[origin] ?? {
			value: origin,
			label: origin,
			description: 'Unknown stamp origin.'
		}
	);
}
