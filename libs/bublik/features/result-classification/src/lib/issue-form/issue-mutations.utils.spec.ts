/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import type { Issue } from '@/shared/types';

import type { IssueFormValues } from './issue-form.component';
import {
	buildIssueUpdateBody,
	issueStateTransition
} from './issue-mutations.hooks';

function issue(overrides: Partial<Issue> = {}): Issue {
	return {
		id: 7,
		title: 'ethtool reset regression',
		description: null,
		state: 'open',
		issue_ext: {
			id: 1,
			key: 'ref://JIRA/FOO-123',
			status: null,
			title: null,
			synced_at: null
		},
		created_at: '2026-01-01T00:00:00Z',
		updated_at: '2026-01-01T00:00:00Z',
		closed_at: null,
		...overrides
	};
}

function values(overrides: Partial<IssueFormValues> = {}): IssueFormValues {
	return {
		title: 'ethtool reset regression',
		description: '',
		tracker: 'JIRA',
		bugKey: 'FOO-123',
		state: 'open',
		...overrides
	};
}

describe('buildIssueUpdateBody', () => {
	/**
	 * The one that matters. `validate_bug_key` rejects the field's *presence* on
	 * an issue with classified results, so sending the unchanged key back would
	 * turn a title edit into "Cannot change the bug key…".
	 */
	it('omits bug_key entirely when neither half moved', () => {
		expect(buildIssueUpdateBody(values(), issue())).not.toHaveProperty(
			'bug_key'
		);
	});

	it('sends bug_key when the key changed', () => {
		expect(
			buildIssueUpdateBody(values({ bugKey: 'FOO-999' }), issue())
		).toMatchObject({ bug_key: 'ref://JIRA/FOO-999' });
	});

	it('sends bug_key when the tracker changed', () => {
		expect(
			buildIssueUpdateBody(values({ tracker: 'BUGZILLA' }), issue())
		).toMatchObject({ bug_key: 'ref://BUGZILLA/FOO-123' });
	});

	it('sends null to unlink a key that was there before', () => {
		expect(
			buildIssueUpdateBody(values({ tracker: '', bugKey: '' }), issue())
		).toMatchObject({ bug_key: null });
	});

	it('omits bug_key when there was none and none was entered', () => {
		expect(
			buildIssueUpdateBody(
				values({ tracker: '', bugKey: '' }),
				issue({ issue_ext: null })
			)
		).not.toHaveProperty('bug_key');
	});

	it('trims the title and normalises a blank description to null', () => {
		expect(
			buildIssueUpdateBody(
				values({ title: '  padded  ', description: '   ' }),
				issue()
			)
		).toMatchObject({ title: 'padded', description: null });
	});
});

describe('issueStateTransition', () => {
	it('asks for nothing when the state did not move', () => {
		expect(issueStateTransition(values({ state: 'open' }), issue())).toBeNull();
	});

	it('closes when the form says closed', () => {
		expect(issueStateTransition(values({ state: 'closed' }), issue())).toBe(
			'close'
		);
	});

	it('reopens when the form says open on a closed issue', () => {
		expect(
			issueStateTransition(
				values({ state: 'open' }),
				issue({ state: 'closed' })
			)
		).toBe('reopen');
	});
});
