/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import type { Issue } from '@/shared/types';

import { IssueFormSchema, issueToFormValues } from './issue-form.component';

const BASE = {
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
		title: 'ethtool reset regression',
		description: null,
		state: 'open',
		issue_ext: null,
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

	it('rejects a tracker without a key', () => {
		expect(errorsFor({ ...BASE, tracker: 'JIRA' })).toEqual({
			bugKey: 'Enter a bug key'
		});
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
			issueToFormValues(
				issue({
					issue_ext: {
						id: 1,
						key: 'ref://JIRA/FOO-123',
						status: null,
						title: null,
						synced_at: null
					}
				})
			)
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

	it('defaults to a blank open issue when there is nothing to edit', () => {
		expect(issueToFormValues()).toEqual({
			title: '',
			description: '',
			tracker: '',
			bugKey: '',
			state: 'open'
		});
	});
});
