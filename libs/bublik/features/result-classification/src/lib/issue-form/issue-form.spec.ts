/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import type { Issue } from '@/shared/types';

import { IssueFormSchema } from './issue-form.types';
import { issueToFormValues } from './issue-form.utils';

const BASE = {
	project: 1,
	title: 'ethtool reset regression',
	description: '',
	tracker: '',
	bugKey: '',
	state: 'open' as const
};

function errorsFor(values: Record<string, unknown>) {
	const result = IssueFormSchema.safeParse(values);

	if (result.success) return {};

	return Object.fromEntries(
		result.error.issues.map((issue) => [issue.path.join('.'), issue.message])
	);
}

function issue(overrides: Partial<Issue> = {}): Issue {
	return {
		id: 7,
		project: 1,
		title: 'ethtool reset regression',
		description: null,
		state: 'open',
		bug_key: null,
		bug_url: null,
		categories: [],
		rule_count: 0,
		active_rule_count: 0,
		created_at: '2026-01-01T00:00:00Z',
		updated_at: '2026-01-01T00:00:00Z',
		closed_at: null,
		...overrides
	};
}

describe('IssueFormSchema', () => {
	it('accepts an issue with no bug key — the field is optional', () => {
		expect(errorsFor(BASE)).toEqual({});
	});

	it('requires a project — the server rejects a create without one', () => {
		expect(errorsFor({ ...BASE, project: 0 })).toEqual({
			project: 'Select a project'
		});
	});

	it('requires a title', () => {
		expect(errorsFor({ ...BASE, title: '' })).toEqual({
			title: 'Title is required'
		});
	});

	it('accepts a tracker and key together', () => {
		expect(errorsFor({ ...BASE, tracker: 'JIRA', bugKey: 'FOO-123' })).toEqual(
			{}
		);
	});

	it('rejects a key without a tracker', () => {
		expect(errorsFor({ ...BASE, bugKey: 'FOO-123' })).toEqual({
			tracker: 'Choose a tracker'
		});
	});

	it('accepts a tracker without a key — the field pre-fills from the project config', () => {
		expect(errorsFor({ ...BASE, tracker: 'JIRA' })).toEqual({});
	});

	it('rejects a tracker containing a slash — `REF_CORE` forbids it', () => {
		expect(
			errorsFor({ ...BASE, tracker: 'JIRA/EU', bugKey: 'FOO-123' })
		).toEqual({ tracker: 'Tracker cannot contain spaces or "/"' });
	});

	it('rejects a key with characters the backend validator rejects', () => {
		expect(errorsFor({ ...BASE, tracker: 'JIRA', bugKey: 'FOO 123' })).toEqual({
			bugKey: 'Bug key can only contain letters, digits and - _ / :'
		});
	});
});

describe('issueToFormValues', () => {
	it('splits the stored URI back into the two fields that produced it', () => {
		expect(
			issueToFormValues(issue({ bug_key: 'ref://JIRA/FOO-123' }))
		).toMatchObject({ tracker: 'JIRA', bugKey: 'FOO-123' });
	});

	it('leaves both halves blank for an issue with no tracker reference', () => {
		expect(issueToFormValues(issue())).toMatchObject({
			tracker: '',
			bugKey: ''
		});
	});

	it('normalises a null description to an empty string', () => {
		expect(issueToFormValues(issue({ description: null })).description).toBe(
			''
		);
	});

	it('carries the state through, so the lifecycle select starts truthful', () => {
		expect(issueToFormValues(issue({ state: 'closed' })).state).toBe('closed');
	});

	it('takes the project from the issue being edited', () => {
		expect(issueToFormValues(issue({ project: 4 }), 9).project).toBe(4);
	});

	it('prefills the project for a new issue from the caller', () => {
		expect(issueToFormValues(null, 9).project).toBe(9);
	});

	it('defaults to a blank open issue when there is nothing to edit', () => {
		expect(issueToFormValues()).toEqual({
			project: 0,
			title: '',
			description: '',
			tracker: '',
			bugKey: '',
			state: 'open'
		});
	});
});
