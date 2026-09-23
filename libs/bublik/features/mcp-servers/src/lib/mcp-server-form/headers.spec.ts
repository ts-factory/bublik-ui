/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET Labs Ltd. */
import { describe, expect, it } from 'vitest';

import { namesToRows, rowsToCreateMap, rowsToPatchMap } from './headers';

describe('headers editor mapping', () => {
	it('starts an edit from the stored names with values withheld', () => {
		expect(namesToRows(['Authorization', 'X-Team'])).toEqual([
			{ name: 'Authorization', value: '', existing: true },
			{ name: 'X-Team', value: '', existing: true }
		]);
	});

	it('sends the full mapping on create, trimming names', () => {
		expect(
			rowsToCreateMap([
				{ name: ' Authorization ', value: 'Bearer x', existing: false },
				{ name: 'X-Team', value: 'qa', existing: false }
			])
		).toEqual({ Authorization: 'Bearer x', 'X-Team': 'qa' });
	});

	it('keeps a stored header left blank, replaces one given a value', () => {
		const patch = rowsToPatchMap(
			[
				{ name: 'Authorization', value: '', existing: true },
				{ name: 'X-Team', value: 'dev', existing: true }
			],
			['Authorization', 'X-Team']
		);

		expect(patch).toEqual({ 'X-Team': 'dev' });
	});

	it('removes a stored header whose row was deleted and adds new rows', () => {
		const patch = rowsToPatchMap(
			[{ name: 'X-New', value: 'n', existing: false }],
			['Authorization', 'X-Team']
		);

		expect(patch).toEqual({
			Authorization: null,
			'X-Team': null,
			'X-New': 'n'
		});
	});

	it('lets a new row take over a removed stored name', () => {
		const patch = rowsToPatchMap(
			[{ name: 'Authorization', value: 'Bearer new', existing: false }],
			['Authorization']
		);

		expect(patch).toEqual({ Authorization: 'Bearer new' });
	});
});
