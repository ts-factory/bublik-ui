/* SPDX-License-Identifier: Apache-2.0 */
import { describe, expect, it } from 'vitest';

import type { RunIssueRow } from '@/shared/types';

import {
	CATEGORY_META,
	CATEGORY_ORDER,
	aggregateExpected,
	categoryMeta,
	formatBugKey,
	issueRulesState,
	issueStateMeta,
	resultClassification,
	resultIssueEffect,
	runIssueEffect,
	RESULT_CLASSIFICATION_ORDER
} from './classification.utils';

function issue(partial: Partial<RunIssueRow>): RunIssueRow {
	return {
		issue_id: 1,
		title: 'Issue',
		state: 'open',
		bug_key: null,
		bug_url: null,
		result_count: 1,
		categories: [],
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

describe('aggregateExpected', () => {
	it('ORs like the backend suppression filter — any expected wins', () => {
		expect(
			aggregateExpected([
				{ category: 'product-defect', expected: false },
				{ category: 'known-issue', expected: true }
			])
		).toBe(true);
	});

	it('reports unexpected when no rule says expected', () => {
		expect(
			aggregateExpected([
				{ category: 'product-defect', expected: false },
				{ category: 'to-investigate', expected: null }
			])
		).toBe(false);
	});

	it('reports none when nothing has a disposition', () => {
		expect(
			aggregateExpected([{ category: 'to-investigate', expected: null }])
		).toBeNull();
	});
});

describe('runIssueEffect', () => {
	const expectedCategories = [
		{ category: 'known-issue' as const, expected: true }
	];

	it('suppresses on an open issue with an expected rule', () => {
		expect(
			runIssueEffect(issue({ state: 'open', categories: expectedCategories }))
				.value
		).toBe('suppressed');
	});

	it('goes stale when the issue is closed — closing un-suppresses', () => {
		expect(
			runIssueEffect(issue({ state: 'closed', categories: expectedCategories }))
				.value
		).toBe('stale');
	});

	it('stays unexpected when the rules say so', () => {
		expect(
			runIssueEffect(
				issue({ categories: [{ category: 'product-defect', expected: false }] })
			).value
		).toBe('unexpected');
	});

	it('is marked-only when no rule sets a disposition', () => {
		expect(
			runIssueEffect(
				issue({ categories: [{ category: 'to-investigate', expected: null }] })
			).value
		).toBe('marked');
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

describe('issueRulesState', () => {
	it('is enforced while any rule is active', () => {
		expect(issueRulesState({ state: 'open', total: 3, active: 1 }).value).toBe(
			'enforced'
		);
	});

	it('flags an open issue whose rules are all off — reopen does not re-activate', () => {
		expect(issueRulesState({ state: 'open', total: 3, active: 0 }).value).toBe(
			'dormant'
		);
	});

	it('treats the same shape on a closed issue as expected, not a warning', () => {
		expect(
			issueRulesState({ state: 'closed', total: 3, active: 0 }).value
		).toBe('deactivated');
	});

	it('reports no rules before anything has been classified', () => {
		expect(issueRulesState({ state: 'open', total: 0, active: 0 }).value).toBe(
			'unruled'
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
