/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

import { describe, expect, it } from 'vitest';

import {
	DASHBOARD_SIDEBAR_KEYS,
	RUNS_SIDEBAR_KEYS,
	SHARED_SIDEBAR_KEYS,
	SIDEBAR_STATE_PARAM
} from './sidebar-state.constants';
import {
	decodeCompressedState,
	encodeCompressedState,
	getSidebarStateString,
	getSidebarStateStringArray,
	SIDEBAR_STATE_MAX_LENGTH,
	setSidebarStateValue,
	stripSidebarParamsFromUrl,
	updateSidebarStateSearchParams
} from './sidebar-url.utils';

describe('sidebar URL state', () => {
	it('stores sidebar state in compact v2 format and reads it through logical keys', () => {
		const params = updateSidebarStateSearchParams(
			new URLSearchParams(),
			(sidebarState) => {
				setSidebarStateValue(sidebarState, RUNS_SIDEBAR_KEYS.LAST_MODE, 'list');
				setSidebarStateValue(sidebarState, RUNS_SIDEBAR_KEYS.SELECTED, [
					'11',
					'22'
				]);
				setSidebarStateValue(
					sidebarState,
					DASHBOARD_SIDEBAR_KEYS.LAST_URL,
					'/dashboard?project=1&mode=default&_s=old&filter=failed'
				);
			}
		);

		expect(params).not.toBeNull();
		if (!params) {
			throw new Error('Expected sidebar params to be updated');
		}

		const encodedState = params.get(SIDEBAR_STATE_PARAM);
		expect(encodedState).toBeTruthy();
		expect(decodeCompressedState<unknown>(encodedState ?? '')).toEqual([
			2,
			{
				du: '/dashboard?filter=failed',
				rm: 'list',
				rs: ['11', '22']
			}
		]);
		expect(getSidebarStateString(params, RUNS_SIDEBAR_KEYS.LAST_MODE)).toBe(
			'list'
		);
		expect(
			getSidebarStateStringArray(params, RUNS_SIDEBAR_KEYS.SELECTED)
		).toEqual(['11', '22']);
		expect(getSidebarStateString(params, DASHBOARD_SIDEBAR_KEYS.LAST_URL)).toBe(
			'/dashboard?filter=failed'
		);
	});

	it('does not read old plain sidebar maps from _s', () => {
		const params = new URLSearchParams();
		params.set(
			SIDEBAR_STATE_PARAM,
			encodeCompressedState({ [RUNS_SIDEBAR_KEYS.LAST_MODE]: 'charts' })
		);

		expect(
			getSidebarStateString(params, RUNS_SIDEBAR_KEYS.LAST_MODE)
		).toBeNull();
	});

	it('does not read legacy global sidebar params', () => {
		const params = new URLSearchParams(`${RUNS_SIDEBAR_KEYS.LAST_MODE}=charts`);

		expect(
			getSidebarStateString(params, RUNS_SIDEBAR_KEYS.LAST_MODE)
		).toBeNull();
	});

	it('strips recursive sidebar state, project params, and empty defaults from URLs', () => {
		expect(
			stripSidebarParamsFromUrl(
				'/runs?project=1&global.runs.lastMode=list&_s=old&mode=default&tagExpr=&runData=abc#section'
			)
		).toBe('/runs?runData=abc#section');
	});

	it('prunes optional sidebar URLs to keep _s under budget', () => {
		const longUrl = `/dashboard?filter=${'x'.repeat(
			SIDEBAR_STATE_MAX_LENGTH * 3
		)}`;
		const params = updateSidebarStateSearchParams(
			new URLSearchParams(),
			(sidebarState) => {
				setSidebarStateValue(sidebarState, RUNS_SIDEBAR_KEYS.SELECTED, [
					'101',
					'102'
				]);
				setSidebarStateValue(
					sidebarState,
					SHARED_SIDEBAR_KEYS.CURRENT_RUN_ID,
					'101'
				);
				setSidebarStateValue(
					sidebarState,
					DASHBOARD_SIDEBAR_KEYS.LAST_URL,
					longUrl
				);
			}
		);

		expect(params).not.toBeNull();
		if (!params) {
			throw new Error('Expected sidebar params to be updated');
		}

		const encodedState = params.get(SIDEBAR_STATE_PARAM);
		expect(encodedState?.length).toBeLessThanOrEqual(SIDEBAR_STATE_MAX_LENGTH);
		expect(
			getSidebarStateStringArray(params, RUNS_SIDEBAR_KEYS.SELECTED)
		).toEqual(['101', '102']);
		expect(
			getSidebarStateString(params, SHARED_SIDEBAR_KEYS.CURRENT_RUN_ID)
		).toBe('101');
		expect(
			getSidebarStateString(params, DASHBOARD_SIDEBAR_KEYS.LAST_URL)
		).toBeNull();
	});
});
