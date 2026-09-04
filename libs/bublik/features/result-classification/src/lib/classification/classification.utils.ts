/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { BadgeVariants } from '@/shared/tailwind-ui';
import type {
	IssueCategory,
	IssueState,
	ResultIssueRef,
	RunIssueRow
} from '@/shared/types';

import {
	CATEGORY_META,
	DISPOSITION_META,
	ISSUE_RULES_STATE_META,
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
}): ResultClassificationMeta | null {
	const stamps = input.issues ?? [];

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

export function originMeta(origin: RuleResultOrigin): OriginMeta {
	return (
		ORIGIN_META[origin] ?? {
			value: origin,
			label: origin,
			description: 'Unknown stamp origin.'
		}
	);
}
