/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, it, expect } from 'vitest';
import { SpecialCategoryValueSchema } from '@/shared/types';

import { extractUrlFromLabel, prepareSpecialCategoryItems } from './utils';
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

describe('special categories', () => {
	const parse = (values: unknown[]) =>
		values.map((value) => SpecialCategoryValueSchema.parse(value));

	it('reads the objects with a link', () => {
		const items = parse([
			{
				name: 'BACKEND_PR',
				value: '#353',
				url: 'https://github.com/ts-factory/bublik/pull/353'
			},
			{ name: null, value: 'cfg-x', url: null }
		]);

		expect(prepareSpecialCategoryItems(items, 'bg-badge-4')).toEqual([
			{
				name: 'BACKEND_PR',
				value: '#353',
				url: 'https://github.com/ts-factory/bublik/pull/353',
				className: 'bg-badge-4',
				isImportant: false
			},
			{
				value: 'cfg-x',
				url: undefined,
				className: 'bg-badge-4',
				isImportant: undefined
			}
		]);
	});

	it('still reads the raw labels an older backend sends', () => {
		const [item] = prepareSpecialCategoryItems(
			parse(['DOCKER_PR=https://github.com/ts-factory/bublik-docker/pull/94']),
			'bg-badge-4'
		);

		expect(item.url).toBe(
			'https://github.com/ts-factory/bublik-docker/pull/94'
		);
		expect(item.value).not.toContain('=');
	});
});
