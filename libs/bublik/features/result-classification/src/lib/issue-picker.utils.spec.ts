import { describe, expect, it } from 'vitest';
import { issueTag } from './issue-picker.utils';

describe('issueTag', () => {
	it('prefers the bug key', () => {
		expect(issueTag({ id: 1, key: 'ISSUE-7', category: 'flaky' })).toBe('ISSUE-7');
	});
	it('falls back to category', () => {
		expect(issueTag({ id: 1, key: null, category: 'known-issue' })).toBe('known-issue');
	});
	it('falls back to #id', () => {
		expect(issueTag({ id: 42, key: null, category: null })).toBe('#42');
	});
});
