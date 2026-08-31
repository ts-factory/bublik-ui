/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import { ClassifyFormSchema } from './classify-form';

const BASE = {
	mode: 'new' as const,
	title: 'ethtool reset regression',
	tracker: '',
	bugKey: '',
	category: 'known-issue',
	scope: 'future' as const,
	expected: 'none' as const,
	matchParameters: true,
	matchVerdicts: true,
	matchImportantTags: true,
	matchAllTags: false
};

function errorsFor(values: Record<string, unknown>) {
	const result = ClassifyFormSchema.safeParse(values);

	if (result.success) return {};

	return Object.fromEntries(
		result.error.issues.map((issue) => [issue.path.join('.'), issue.message])
	);
}

describe('ClassifyFormSchema', () => {
	it('accepts a new issue with no bug key — the field is optional', () => {
		expect(errorsFor(BASE)).toEqual({});
	});

	it('accepts a tracker and key together', () => {
		expect(
			errorsFor({ ...BASE, tracker: 'JIRA', bugKey: 'FOO-123' })
		).toEqual({});
	});

	it('rejects half a bug key', () => {
		expect(errorsFor({ ...BASE, bugKey: 'FOO-123' })).toEqual({
			tracker: 'Choose a tracker'
		});
		expect(errorsFor({ ...BASE, tracker: 'JIRA' })).toEqual({
			bugKey: 'Enter a bug key'
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
				bugKey: 'FOO-123'
			})
		).toEqual({});
	});
});
