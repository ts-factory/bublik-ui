/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import { serializeIdArgs } from './serialize-id-args';

const key = (queryArgs: unknown) =>
	serializeIdArgs({
		endpointName: 'getRunDetails',
		queryArgs,
		endpointDefinition: {} as never
	});

describe('serializeIdArgs: one cache entry per id, number or string', () => {
	it('keys a numeric id and its string as one entry', () => {
		expect(key(42)).toBe(key('42'));
	});

	it('keys numeric fields of an object argument as strings', () => {
		expect(key({ runId: 42, configId: 3 })).toBe(
			key({ runId: '42', configId: '3' })
		);
	});

	it('keeps different ids apart', () => {
		expect(key(42)).not.toBe(key(43));
		expect(key({ runId: 42 })).not.toBe(key({ runId: 42, extra: true }));
	});

	it('leaves skipped and non-id arguments to the default key', () => {
		expect(key({ runId: '1', requirements: ['a', 'b'] })).toBe(
			key({ runId: 1, requirements: ['a', 'b'] })
		);
		expect(key(undefined)).toBe('getRunDetails(undefined)');
	});
});
