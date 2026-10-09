/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { describe } from 'vitest';
import { createGetRouterUrl } from './auth.utils';
describe('createGetRouterUrl', () => {
	const getRouterUrl = createGetRouterUrl('/myapp');
	it('should return a valid router URL when provided a string URL', () => {
		const inputUrl =
			'https://example.com/myapp/path/to/page?param1=value1&param2=value2';
		const expectedUrl = '/path/to/page?param1=value1&param2=value2';
		expect(getRouterUrl(inputUrl)).toBe(expectedUrl);
	});
	it('should return a valid router URL when provided a URL object', () => {
		const inputUrl = new URL(
			'https://example.com/myapp/path/to/page?param1=value1&param2=value2'
		);
		const expectedUrl = '/path/to/page?param1=value1&param2=value2';
		expect(getRouterUrl(inputUrl)).toBe(expectedUrl);
	});
	it('should handle URLs with no search parameters', () => {
		const inputUrl = 'https://example.com/myapp/path/to/page';
		const expectedUrl = '/path/to/page';
		expect(getRouterUrl(inputUrl)).toBe(expectedUrl);
	});
	it('should handle URLs with no pathname and only search parameters', () => {
		const inputUrl = 'https://example.com/myapp?param1=value1&param2=value2';
		const expectedUrl = '/?param1=value1&param2=value2';
		expect(getRouterUrl(inputUrl)).toBe(expectedUrl);
	});
	it('should handle URLs with no pathname, no search parameters, and a base path', () => {
		const inputUrl = 'https://example.com/myapp';
		const expectedUrl = '/';
		expect(getRouterUrl(inputUrl)).toBe(expectedUrl);
	});
	it('should return an empty string when provided an empty string', () => {
		const inputUrl = '';
		const expectedUrl = '';
		expect(getRouterUrl(inputUrl)).toBe(expectedUrl);
	});
	it('should return a valid router URL when provided a string URL with a hash', () => {
		const inputUrl =
			'https://example.com/myapp/path/to/page?param1=value1&param2=value2#section';
		const expectedUrl = '/path/to/page?param1=value1&param2=value2#section';
		expect(getRouterUrl(inputUrl)).toBe(expectedUrl);
	});
	it('should handle URLs with a hash and no search parameters', () => {
		const inputUrl = 'https://example.com/myapp/path/to/page#section';
		const expectedUrl = '/path/to/page#section';
		expect(getRouterUrl(inputUrl)).toBe(expectedUrl);
	});
	it('should handle URLs with a hash, no pathname, no search parameters, and a base path', () => {
		const inputUrl = 'https://example.com/myapp#section';
		const expectedUrl = '/#section';
		expect(getRouterUrl(inputUrl)).toBe(expectedUrl);
	});
});

describe('createGetRouterUrl on a prefixed deployment', () => {
	// `config.baseUrl` is `<prefix>/v2` there, and the router's basepath with it.
	const getRouterUrl = createGetRouterUrl('/bublik/v2');

	it('strips the prefixed base URL and keeps the query and fragment', () => {
		expect(
			getRouterUrl(
				'https://example.com/bublik/v2/runs/1?mode=charts&project=2#top'
			)
		).toBe('/runs/1?mode=charts&project=2#top');
	});

	it('round-trips a redirect_url as the login page reads it off its query', () => {
		const pageUrl = 'https://example.com/bublik/v2/log/7?focusId=9&mode=tree';
		const loginUrl = new URL('https://example.com/bublik/v2/auth/login');
		loginUrl.searchParams.set('redirect_url', pageUrl);

		const redirectUrl = new URL(loginUrl.href).searchParams.get('redirect_url');

		expect(redirectUrl).toBe(pageUrl);
		expect(getRouterUrl(redirectUrl ?? '')).toBe('/log/7?focusId=9&mode=tree');
	});

	it('maps the bare prefixed base URL to the router root', () => {
		expect(getRouterUrl('https://example.com/bublik/v2')).toBe('/');
	});
});
