/* SPDX-License-Identifier: Apache-2.0 */
import { describe, expect, it } from 'vitest';

import type { IssueRuleRef, RuleEffect, RunIssueRow } from '@/shared/types';

import {
	CATEGORY_META,
	CATEGORY_ORDER,
	RESULT_CLASSIFICATION_ORDER
} from './classification.constants';
import {
	categoryMeta,
	formatBugKey,
	issueStateMeta,
	resultClassification,
	resultIssueEffect,
	runIssueEffect
} from './classification.utils';

function issue(partial: Partial<RunIssueRow>): RunIssueRow {
	return {
		issue_id: 1,
		title: 'Issue',
		state: 'open',
		description: null,
		bug_key: null,
		bug_url: null,
		result_count: 1,
		rules: [],
		...partial
	};
}

describe('categories', () => {
	it('covers every category in a stable order', () => {
		expect(CATEGORY_ORDER).toHaveLength(6);
		expect(Object.keys(CATEGORY_META).sort()).toEqual(
			[...CATEGORY_ORDER].sort()
		);
	});

	it('falls back for a category the UI does not know', () => {
		const meta = categoryMeta('brand-new' as never);
		expect(meta.label).toBe('brand-new');
	});
});

describe('runIssueEffect', () => {
	const rule = (effect: RuleEffect, rule_id = 1): IssueRuleRef => ({
		rule_id,
		category: 'known-issue',
		expected: true,
		effect
	});

	it('reads the effect the server computed for the rule', () => {
		expect(runIssueEffect(issue({ rules: [rule('stale')] })).value).toBe(
			'stale'
		);
	});

	it('reports the strongest effect when the rules disagree', () => {
		expect(
			runIssueEffect(
				issue({ rules: [rule('marked', 1), rule('unexpected', 2)] })
			).value
		).toBe('unexpected');
		expect(
			runIssueEffect(
				issue({ rules: [rule('stale', 1), rule('suppressed', 2)] })
			).value
		).toBe('suppressed');
	});

	it('is marked-only with no rules', () => {
		expect(runIssueEffect(issue({ rules: [] })).value).toBe('marked');
	});
});

describe('resultIssueEffect', () => {
	const open = (expected: boolean | null) =>
		({ expected, issue_state: 'open' } as const);
	const closed = (expected: boolean | null) =>
		({ expected, issue_state: 'closed' } as const);

	it('suppresses when any stamp is expected on an open issue', () => {
		expect(resultIssueEffect([open(false), open(true)]).value).toBe(
			'suppressed'
		);
	});

	it('stays unexpected when the only expected stamp is on a closed issue', () => {
		expect(resultIssueEffect([closed(true)]).value).toBe('stale');
	});

	it('is marked-only when no stamp sets a disposition', () => {
		expect(resultIssueEffect([open(null), closed(null)]).value).toBe('marked');
	});

	it('counts when every stamp calls it a real failure', () => {
		expect(resultIssueEffect([open(false)]).value).toBe('unexpected');
	});

	it('does not suppress when the expected flag and the open state sit on different stamps', () => {
		expect(resultIssueEffect([open(false), closed(true)]).value).not.toBe(
			'suppressed'
		);
	});

	it('prefers counting-again, since reopening the closed issue would suppress it', () => {
		expect(resultIssueEffect([open(false), closed(true)]).value).toBe('stale');
	});

	it('is marked-only when there are no stamps at all', () => {
		expect(resultIssueEffect([]).value).toBe('marked');
	});
});

describe('issueStateMeta', () => {
	it('warns that a closed issue stops suppressing', () => {
		expect(issueStateMeta('closed').description).toMatch(
			/no longer suppressed/
		);
	});
});

describe('formatBugKey', () => {
	it('strips the ref:// tracker prefix', () => {
		expect(formatBugKey('ref://JIRA/FOO-123')).toBe('FOO-123');
	});

	it('leaves a plain key alone', () => {
		expect(formatBugKey('FOO-123')).toBe('FOO-123');
	});

	it('passes null through', () => {
		expect(formatBugKey(null)).toBeNull();
	});
});

describe('resultClassification', () => {
	const open = (expected: boolean | null) =>
		({ expected, issue_state: 'open' } as const);

	// `has_error` arrives already suppressed — `is_result_unexpected` returns
	// false the moment a suppressing stamp exists — so without the server's own
	// flag a held-back failure is indistinguishable from a pass carrying a stamp.
	it('reads a suppressed failure from effectiveExpected, not from hasError', () => {
		expect(
			resultClassification({
				issues: [open(true)],
				hasError: false,
				effectiveExpected: true
			})?.value
		).toBe('suppressed');
	});

	it('without the flag the same row falls to no-effect', () => {
		expect(
			resultClassification({ issues: [open(true)], hasError: false })?.value
		).toBe('no-effect');
	});

	it('leaves a row the server did not suppress to the stamps', () => {
		expect(
			resultClassification({
				issues: [open(false)],
				hasError: true,
				effectiveExpected: false
			})?.value
		).toBe('unexpected');
	});

	it('is untriaged when a failure carries no stamps', () => {
		expect(resultClassification({ issues: [], hasError: true })?.value).toBe(
			'untriaged'
		);
		expect(resultClassification({ hasError: true })?.value).toBe('untriaged');
	});

	it('defers to the stamps when a failure has them', () => {
		expect(
			resultClassification({ issues: [open(true)], hasError: true })?.value
		).toBe('suppressed');
		expect(
			resultClassification({ issues: [open(false)], hasError: true })?.value
		).toBe('unexpected');
	});

	it('reports no effect when a passing result carries stamps', () => {
		expect(
			resultClassification({ issues: [open(true)], hasError: false })?.value
		).toBe('no-effect');
	});

	it('has no verdict at all for a passing, unstamped result', () => {
		expect(resultClassification({ issues: [], hasError: false })).toBeNull();
	});

	it('orders the facet with the unlooked-at first and the inert last', () => {
		expect(RESULT_CLASSIFICATION_ORDER[0]).toBe('untriaged');
		expect(RESULT_CLASSIFICATION_ORDER.at(-1)).toBe('no-effect');
		expect(new Set(RESULT_CLASSIFICATION_ORDER).size).toBe(
			RESULT_CLASSIFICATION_ORDER.length
		);
	});
});
