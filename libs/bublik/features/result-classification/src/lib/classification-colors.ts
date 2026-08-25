/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { IconProps } from '@/shared/tailwind-ui';
import type { IssueCategory, IssueState, RunIssueRow } from '@/shared/types';

type IconName = IconProps['name'];

/**
 * Colour policy for classification, in one place.
 *
 * Red/orange means *known bad*, green means *accepted*, and violet means
 * *nobody has decided yet*. The violet family exists precisely so a row that
 * still needs a human does not disappear into a wall of red failures.
 */

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
 */
export const CATEGORY_META: Record<IssueCategory, CategoryMeta> = {
	'product-defect': {
		value: 'product-defect',
		label: 'Product defect',
		displayValue: 'Product defect',
		description:
			'A real defect in the product under test. Counts as unexpected.',
		className: 'bg-badge-13 text-text-unexpected',
		iconName: 'InformationCircleCrossMark'
	},
	'test-bug': {
		value: 'test-bug',
		label: 'Test bug',
		displayValue: 'Test/automation bug',
		description: 'A bug in the test or the automation, not in the product.',
		className: 'bg-badge-14 text-text-primary',
		iconName: 'InformationCircleExclamationMark'
	},
	env: {
		value: 'env',
		label: 'Environment',
		displayValue: 'Environment / infra',
		description: 'Caused by the environment or the infrastructure.',
		className: 'bg-badge-7 text-text-primary',
		iconName: 'InformationCircleForbidden'
	},
	'known-issue': {
		value: 'known-issue',
		label: 'Known issue',
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
		className: 'bg-badge-4 text-text-primary',
		iconName: 'InformationCircleProgress'
	},
	'to-investigate': {
		value: 'to-investigate',
		label: 'To investigate',
		displayValue: 'To investigate',
		description: 'Noted, but nobody has worked out the cause yet.',
		className: 'bg-badge-2 text-text-triage',
		iconName: 'TriangleQuestionMark'
	}
};

export const CATEGORY_ORDER: IssueCategory[] = [
	'product-defect',
	'test-bug',
	'env',
	'known-issue',
	'flaky',
	'to-investigate'
];

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
 * An issue's effect on this run's unexpected count.
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
	iconName: IconName;
}

export const RUN_ISSUE_EFFECT_META: Record<RunIssueEffect, RunIssueEffectMeta> =
	{
		suppressed: {
			value: 'suppressed',
			label: 'Suppressed',
			description:
				'At least one rule marks these results expected and the issue is open, so they do not count as unexpected.',
			className: 'bg-badge-3 text-text-expected',
			iconName: 'EyeHide'
		},
		stale: {
			value: 'stale',
			label: 'Counting again',
			description:
				'These results were suppressed, but the issue is closed — they count as unexpected again.',
			className: 'bg-badge-14 text-text-primary',
			iconName: 'InformationCircleStop'
		},
		unexpected: {
			value: 'unexpected',
			label: 'Unexpected',
			description:
				'Explained, but still a real failure — these results keep counting as unexpected.',
			className: 'bg-badge-13 text-text-unexpected',
			iconName: 'InformationCircleCrossMark'
		},
		marked: {
			value: 'marked',
			label: 'Marked only',
			description:
				'Stamped with no disposition, so nothing was decided and nothing is suppressed.',
			className: 'bg-badge-2 text-text-triage',
			iconName: 'TriangleQuestionMark'
		}
	};

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

export function runIssueEffect(issue: RunIssueRow): RunIssueEffectMeta {
	const expected = aggregateExpected(issue.categories);

	if (expected === true) {
		return issue.state === 'open'
			? RUN_ISSUE_EFFECT_META.suppressed
			: RUN_ISSUE_EFFECT_META.stale;
	}

	if (expected === false) return RUN_ISSUE_EFFECT_META.unexpected;

	return RUN_ISSUE_EFFECT_META.marked;
}

/** Strips the `ref://TRACKER/` prefix so chips show `FOO-123`, not the URI. */
export function formatBugKey(bugKey: string | null): string | null {
	if (!bugKey) return null;
	const match = /^ref:\/\/[^/\s]+\/(.+)$/.exec(bugKey);
	return match ? match[1] : bugKey;
}
