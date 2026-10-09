/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import { ClassifyFormSchema } from './classify-form.types';

const BASE = {
	mode: 'new' as const,
	title: 'ethtool reset regression',
	tracker: 'JIRA',
	bugKey: 'FOO-123',
	categories: ['known-issue'],
	scope: 'future' as const,
	expected: 'none' as const,
	picks: { tags: null, tests: {}, fallback: null }
};

function errorsFor(values: Record<string, unknown>) {
	const result = ClassifyFormSchema.safeParse(values);

	if (result.success) return {};

	return Object.fromEntries(
		result.error.issues.map((issue) => [issue.path.join('.'), issue.message])
	);
}

describe('ClassifyFormSchema', () => {
	it('accepts a new issue with a tracker and key', () => {
		expect(errorsFor(BASE)).toEqual({});
	});

	it('requires at least one category', () => {
		expect(errorsFor({ ...BASE, categories: [] })).toEqual({
			categories: 'Select at least one category'
		});
		expect(errorsFor({ ...BASE, categories: ['flaky', 'env'] })).toEqual({});
	});

	it('requires a bug key for a new issue', () => {
		expect(errorsFor({ ...BASE, bugKey: '' })).toEqual({
			bugKey: 'Bug key is required'
		});
	});

	it('asks for the tracker alongside the title and key on one submit', () => {
		expect(errorsFor({ ...BASE, title: '', tracker: '', bugKey: '' })).toEqual({
			title: 'Title is required',
			tracker: 'Choose a tracker',
			bugKey: 'Bug key is required'
		});
	});

	it('rejects a key with no tracker to resolve it against', () => {
		expect(errorsFor({ ...BASE, tracker: '' })).toEqual({
			tracker: 'Choose a tracker'
		});
	});

	it('rejects halves the backend regex would reject', () => {
		expect(errorsFor({ ...BASE, tracker: 'JI RA', bugKey: 'FOO-123' })).toEqual(
			{ tracker: 'Tracker cannot contain spaces or "/"' }
		);
		expect(errorsFor({ ...BASE, tracker: 'JIRA', bugKey: 'FOO 123' })).toEqual({
			bugKey: 'Bug key can only contain letters, digits and - _ / :'
		});
	});

	it('requires a title for a new issue rather than inventing "Untitled"', () => {
		expect(errorsFor({ ...BASE, title: '' })).toEqual({
			title: 'Title is required'
		});
		expect(errorsFor({ ...BASE, title: '   ' })).toEqual({
			title: 'Title is required'
		});
	});

	it('requires a picked issue under "existing"', () => {
		expect(errorsFor({ ...BASE, mode: 'existing', title: '' })).toEqual({
			issueId: 'Select an issue'
		});
		expect(
			errorsFor({ ...BASE, mode: 'existing', title: '', issueId: 42 })
		).toEqual({});
	});

	it('ignores the new-issue fields under "existing"', () => {
		expect(
			errorsFor({
				...BASE,
				mode: 'existing',
				issueId: 42,
				title: '',
				tracker: '',
				bugKey: ''
			})
		).toEqual({});
	});
});
