/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { isNotFound } from '@tanstack/react-router';
import { describe, expect, it } from 'vitest';

import { idParams, isIdSegment, parseId } from './id-params';

function thrown(run: () => unknown): unknown {
	try {
		run();
	} catch (error) {
		return error;
	}
	return undefined;
}

describe('id path params', () => {
	it.each(['0', '7', '42', '007'])('%s is an id', (raw) => {
		expect(isIdSegment(raw)).toBe(true);
		expect(parseId(raw)).toBe(Number(raw));
	});

	it.each(['', 'abc', '-1', '1.5', '1e3', ' 1', '1 ', 'rules', '0x10'])(
		'%j is not an id and throws notFound()',
		(raw) => {
			expect(isIdSegment(raw)).toBe(false);
			expect(isNotFound(thrown(() => parseId(raw)))).toBe(true);
		}
	);

	it('parses and stringifies every named key', () => {
		const params = idParams('runId', 'resultId');

		expect(params.parse({ runId: '7', resultId: '12' })).toEqual({
			runId: 7,
			resultId: 12
		});
		expect(params.stringify({ runId: 7, resultId: 12 })).toEqual({
			runId: '7',
			resultId: '12'
		});
	});

	it('is not found when any of its keys is not an id', () => {
		const params = idParams('runId', 'resultId');

		expect(
			isNotFound(thrown(() => params.parse({ runId: '7', resultId: 'x' })))
		).toBe(true);
	});
});
