/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { describe, expect } from 'vitest';

import { runToImportUrl, getUrl } from './parse-import-url';

describe('getUrl', () => {
	it('should add the "force" parameter when run.force is true', () => {
		const run = { url: 'https://example.com', force: true, range: null };
		const result = getUrl(run);

		const expectedUrl = 'https://example.com/?force=true';
		expect(result.href).toBe(expectedUrl);
	});

	it('should not add the "force" parameter when run.force is false', () => {
		const run = { url: 'https://example.com', force: false, range: null };
		const result = getUrl(run);

		const expectedUrl = 'https://example.com/';
		expect(result.href).toBe(expectedUrl);
	});

	it('should add "from" and "to" parameters when run.range is provided', () => {
		const startDate = new Date('2023-01-01');
		const endDate = new Date('2023-01-31');
		const run = {
			url: 'https://example.com',
			range: { startDate, endDate },
			force: false
		};

		const result = getUrl(run);

		const expectedUrl = 'https://example.com/?from=2023-01-01&to=2023-01-31';
		expect(result.href).toBe(expectedUrl);
	});

	it('should handle edge cases with undefined input', () => {
		const run = { url: 'https://example.com', range: null, force: false };
		const result = getUrl(run);

		const expectedUrl = 'https://example.com/';
		expect(result.href).toBe(expectedUrl);
	});
});

describe('runToImportUrl', () => {
	it('should generate the correct import URL with parameters', () => {
		const run = {
			url: 'https://example.com/',
			force: true,
			range: {
				startDate: new Date('2023-01-01'),
				endDate: new Date('2023-01-31')
			}
		};

		const result = runToImportUrl(run);

		const expectedUrl = `?url=https://example.com&force=true&from=2023-01-01&to=2023-01-31`;

		expect(result).toBe(expectedUrl);
	});

	it('should handle cases with no parameters', () => {
		const run = { url: 'https://example.com/', range: null, force: false };
		const result = runToImportUrl(run);

		const expectedUrl = `?url=https://example.com`;
		expect(result).toBe(expectedUrl);
	});

	it('should handle cases with parameters and no trailing slashes', () => {
		const run = {
			url: 'https://example.com',
			force: false,
			range: {
				startDate: new Date('2023-01-01'),
				endDate: new Date('2023-01-31')
			}
		};

		const result = runToImportUrl(run);

		const expectedUrl = `?url=https://example.com&from=2023-01-01&to=2023-01-31`;

		expect(result).toBe(expectedUrl);
	});
});
