/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

import { describe, expect, it } from 'vitest';

import {
	decodeCompressedOrJsonState,
	encodeCompressedState
} from '@/bublik/features/sidebar';
import { hasPersistedRunTableState } from './run-table.hooks';

describe('hasPersistedRunTableState', () => {
	it('returns true when run table params exist', () => {
		expect(hasPersistedRunTableState('?expanded=%7B%22a%22%3Atrue%7D')).toBe(
			true
		);
		expect(hasPersistedRunTableState('?globalFilter=%5B%5D')).toBe(true);
		expect(hasPersistedRunTableState('?rowState=%7B%7D')).toBe(true);
		expect(hasPersistedRunTableState('?columnFilters=%7B%7D')).toBe(true);
	});

	it('returns false when only sidebar params exist', () => {
		expect(hasPersistedRunTableState('?_s=compressedSidebarState')).toBe(false);
	});

	it('returns false when run table params are missing', () => {
		expect(hasPersistedRunTableState('')).toBe(false);
		expect(hasPersistedRunTableState('?foo=bar')).toBe(false);
	});
});

describe('run table URL decoding', () => {
	it('decodes legacy JSON params from old-style run URLs', () => {
		expect(
			decodeCompressedOrJsonState<Record<string, boolean>>(
				'{"TOTAL":false,"Objective":false,"Notes":false}'
			)
		).toEqual({ TOTAL: false, Objective: false, Notes: false });

		expect(
			decodeCompressedOrJsonState<Record<string, boolean>>(
				'{"149_1":true,"149_1_163_327":true}'
			)
		).toEqual({ '149_1': true, '149_1_163_327': true });

		expect(
			decodeCompressedOrJsonState<Array<{ rowId: string; columnId: string }>>(
				'[{"rowId":"149_1","columnId":"FAILED_EXPECTED"}]'
			)
		).toEqual([{ rowId: '149_1', columnId: 'FAILED_EXPECTED' }]);

		expect(
			decodeCompressedOrJsonState<
				Record<
					string,
					{ rowId: string; requests: Record<string, { results: string[] }> }
				>
			>(
				'{"149_1_150_2":{"rowId":"149_1_150_2","requests":{"FAILED_EXPECTED":{"results":["FAILED","KILLED","CORED"]}}}}'
			)
		).toEqual({
			'149_1_150_2': {
				rowId: '149_1_150_2',
				requests: {
					FAILED_EXPECTED: {
						results: ['FAILED', 'KILLED', 'CORED']
					}
				}
			}
		});
	});

	it('decodes compressed params from current URLs', () => {
		const value = {
			TOTAL: false,
			Objective: false,
			Notes: false
		};

		const encoded = encodeCompressedState(value);

		expect(decodeCompressedOrJsonState<typeof value>(encoded)).toEqual(value);
	});
});
