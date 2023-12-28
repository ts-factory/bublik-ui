/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { it, describe, expect } from 'vitest';

import { constructUrl } from './utils';

describe('constructUrl', () => {
	it('should return correct url', () => {
		const subdirectory = '/prefix';

		expect(constructUrl(subdirectory)).toEqual({
			baseUrl: '/prefix/v2',
			baseUrlApi: '/prefix/api/v2',
			oldBaseUrl: 'http://localhost:3000/prefix',
			rootUrl: '/prefix'
		});
	});

	it('should throw error if subdirectory does not starts with /', () => {
		const subdirectory = 'prj/test/net/bublik';

		expect(() => constructUrl(subdirectory)).toThrowError();
	});

	it('should throw error if subdirectory ends with /', () => {
		const subdirectory = '/prefix/';

		expect(() => constructUrl(subdirectory)).toThrowError();
	});

	it('should return correct url if subdirectory is empty', () => {
		const subdirectory = '';

		expect(constructUrl(subdirectory)).toEqual({
			baseUrl: '/v2',
			baseUrlApi: '/api/v2',
			oldBaseUrl: 'http://localhost:3000',
			rootUrl: ''
		});
	});

	it('should handle `/` subdirectory', () => {
		const subdirectory = '/';

		expect(constructUrl(subdirectory)).toEqual({
			baseUrl: '/v2',
			baseUrlApi: '/api/v2',
			oldBaseUrl: 'http://localhost:3000',
			rootUrl: ''
		});
	});

	it('should handle `/v2` subdirectory', () => {
		const subdirectory = '/v2';

		expect(constructUrl(subdirectory)).toEqual({
			baseUrl: '/v2',
			baseUrlApi: '/api/v2',
			oldBaseUrl: 'http://localhost:3000',
			rootUrl: ''
		});
	});

	it('should handle `/test/v2` subdirectory', () => {
		const subdirectory = '/test/v2';

		expect(constructUrl(subdirectory)).toEqual({
			baseUrl: '/test/v2',
			baseUrlApi: '/test/api/v2',
			oldBaseUrl: 'http://localhost:3000/test',
			rootUrl: '/test'
		});
	});
});
