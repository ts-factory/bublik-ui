/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, it, expect } from 'vitest';
import { extractUrlFromLabel } from './utils';
describe('extractUrlFromLabel', () => {
	it('should extract URLs from labels', () => {
		expect(extractUrlFromLabel('url=https://example.com')).toBe(
			'https://example.com'
		);
		expect(extractUrlFromLabel('url=https://github.com/repo.git')).toBe(
			'https://github.com/repo.git'
		);
		expect(
			extractUrlFromLabel('GIT_URL=https://git.example.com/project/repo.git')
		).toBe('https://git.example.com/project/repo.git');
	});
	it('should handle URLs with trailing punctuation', () => {
		expect(extractUrlFromLabel('url=https://example.com,')).toBe(
			'https://example.com'
		);
		expect(extractUrlFromLabel('url=https://example.com)')).toBe(
			'https://example.com'
		);
		expect(extractUrlFromLabel('url=https://example.com]')).toBe(
			'https://example.com'
		);
		expect(extractUrlFromLabel('url=https://example.com>')).toBe(
			'https://example.com'
		);
	});
	it('should handle URLs with query parameters', () => {
		expect(extractUrlFromLabel('url=https://example.com?param=value')).toBe(
			'https://example.com?param=value'
		);
		expect(extractUrlFromLabel('url=https://example.com?p1=v1&p2=v2')).toBe(
			'https://example.com?p1=v1&p2=v2'
		);
	});
	it('should handle http and https protocols', () => {
		expect(extractUrlFromLabel('url=http://example.com')).toBe(
			'http://example.com'
		);
		expect(extractUrlFromLabel('url=https://example.com')).toBe(
			'https://example.com'
		);
	});
	it('should not extract from non-URL labels', () => {
		expect(extractUrlFromLabel('RUN_STATUS=DONE')).toBeUndefined();
		expect(extractUrlFromLabel('TS_NAME=test')).toBeUndefined();
		expect(extractUrlFromLabel('PARAM=false')).toBeUndefined();
	});
	it('should not extract URLs from key portion', () => {
		expect(
			extractUrlFromLabel('https://example.com url=value')
		).toBeUndefined();
	});
	it('should handle edge cases', () => {
		expect(extractUrlFromLabel('')).toBeUndefined();
		expect(extractUrlFromLabel('url=')).toBeUndefined();
		expect(extractUrlFromLabel('=')).toBeUndefined();
		expect(extractUrlFromLabel('no url')).toBeUndefined();
		expect(extractUrlFromLabel('url=not a url')).toBeUndefined();
		expect(extractUrlFromLabel('url=ftp://example.com')).toBeUndefined();
	});
});
