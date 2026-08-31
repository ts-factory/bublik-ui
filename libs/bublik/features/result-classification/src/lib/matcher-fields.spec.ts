/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import {
	itemsToList,
	itemsToParameters,
	listToItems,
	parametersToItems
} from './matcher-fields';

const items = (...values: string[]) =>
	values.map((value) => ({ id: value, value }));

describe('parameters <-> chips', () => {
	it('round-trips a parameter dict', () => {
		const parameters = { env: 'ci', driver: 'sfc' };

		expect(itemsToParameters(parametersToItems(parameters))).toEqual(
			parameters
		);
	});

	// A chip with no delimiter names a key and no value. Sending it as
	// `{foo: ''}` would be a criterion the user did not write, and one almost
	// nothing satisfies — the matcher compares dict subsets exactly.
	it('drops a chip that carries no value', () => {
		expect(itemsToParameters(items('env'))).toEqual({});
	});

	it('drops a chip with an empty key', () => {
		expect(itemsToParameters(items('=ci'))).toEqual({});
	});

	it('keeps a value containing the delimiter — only the first one splits', () => {
		expect(itemsToParameters(items('cmd=a=b'))).toEqual({ cmd: 'a=b' });
	});

	it('trims either side', () => {
		expect(itemsToParameters(items(' env = ci '))).toEqual({ env: 'ci' });
	});

	it('treats an absent dict as no constraint', () => {
		expect(parametersToItems(undefined)).toEqual([]);
		expect(itemsToParameters(undefined)).toEqual({});
	});
});

describe('lists <-> chips', () => {
	it('round-trips verdicts and tags', () => {
		expect(itemsToList(listToItems(['timeout', 'reset failed']))).toEqual([
			'timeout',
			'reset failed'
		]);
	});

	it('drops blanks rather than sending an empty criterion value', () => {
		expect(itemsToList(items('timeout', '   ', ''))).toEqual(['timeout']);
	});

	it('treats an absent list as no constraint', () => {
		expect(listToItems(null)).toEqual([]);
		expect(itemsToList(undefined)).toEqual([]);
	});
});
