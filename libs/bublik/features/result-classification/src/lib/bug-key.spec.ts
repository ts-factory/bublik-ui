/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import { composeBugKey, splitBugKey } from './bug-key';

describe('composeBugKey', () => {
	it('joins the two halves into the stored URI', () => {
		expect(composeBugKey('JIRA', 'FOO-123')).toBe('ref://JIRA/FOO-123');
	});

	it('trims what the inputs pick up', () => {
		expect(composeBugKey(' JIRA ', ' FOO-123 ')).toBe('ref://JIRA/FOO-123');
	});

	it('is undefined when either half is missing — the field is optional', () => {
		expect(composeBugKey('', '')).toBeUndefined();
		expect(composeBugKey(undefined, undefined)).toBeUndefined();
		expect(composeBugKey('JIRA', '')).toBeUndefined();
		expect(composeBugKey('', 'FOO-123')).toBeUndefined();
	});
});

describe('splitBugKey', () => {
	it('splits a full reference', () => {
		expect(splitBugKey('ref://JIRA/FOO-123')).toEqual({
			tracker: 'JIRA',
			key: 'FOO-123'
		});
	});

	it('keeps slashes that belong to the key', () => {
		expect(splitBugKey('ref://JIRA/team/FOO-123')).toEqual({
			tracker: 'JIRA',
			key: 'team/FOO-123'
		});
	});

	it('leaves a bare key alone', () => {
		expect(splitBugKey('FOO-123')).toBeNull();
	});

	it('splits a scheme-less pair only when the tracker is one we know', () => {
		expect(splitBugKey('JIRA/FOO-123')).toBeNull();
		expect(splitBugKey('JIRA/FOO-123', ['JIRA'])).toEqual({
			tracker: 'JIRA',
			key: 'FOO-123'
		});
	});

	it('rejects halves the backend regex would reject', () => {
		expect(splitBugKey('ref://JI RA/FOO-123')).toBeNull();
		expect(splitBugKey('ref://JIRA/FOO 123')).toBeNull();
		expect(splitBugKey('ref://JIRA/')).toBeNull();
		expect(splitBugKey('ref:///FOO-123')).toBeNull();
	});
});
