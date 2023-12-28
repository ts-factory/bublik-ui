/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { describe, it, expect } from 'vitest';

import { withApiV2 } from './config';

describe('withApiV2', () => {
	it('should append API_V2_PREFIX and a trailing slash when disableTrailingSlash is not provided', () => {
		const endpointUrl = '/example';
		const result = withApiV2(endpointUrl);

		expect(result).toBe(`/api/v2${endpointUrl}/`);
	});

	it('should append API_V2_PREFIX without a trailing slash when disableTrailingSlash is true', () => {
		const endpointUrl = '/example';
		const result = withApiV2(endpointUrl, true);

		expect(result).toBe(`/api/v2${endpointUrl}`);
	});

	it('should throw an error if search params are present and disableTrailingSlash is false', () => {
		const endpointUrl = '/example?param=value';

		expect(() => withApiV2(endpointUrl)).toThrowError(
			'Must disable trailing slash when search params present!'
		);
	});

	it('should append API_V2_PREFIX without a trailing slash when search params are present and disableTrailingSlash is true', () => {
		const endpointUrl = '/example?param=value';
		const result = withApiV2(endpointUrl, true);

		expect(result).toBe(`/api/v2${endpointUrl}`);
	});
});
