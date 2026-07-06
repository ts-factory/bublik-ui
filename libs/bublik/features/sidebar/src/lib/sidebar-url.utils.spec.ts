/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

import { describe, expect, it } from 'vitest';

import {
	DASHBOARD_SIDEBAR_KEYS,
	HISTORY_SIDEBAR_KEYS,
	LOG_SIDEBAR_KEYS,
	RUNS_SIDEBAR_KEYS,
	RUN_SIDEBAR_KEYS,
	SHARED_SIDEBAR_KEYS,
	SIDEBAR_STATE_PARAM
} from './sidebar-state.constants';
import {
	decodeCompressedState,
	encodeCompressedState,
	getSidebarStateString,
	getSidebarStateStringArray,
	SIDEBAR_KEY_REGISTRY,
	SIDEBAR_STATE_MAX_LENGTH,
	setSidebarStateValue,
	stripSidebarParamsFromUrl,
	updateSidebarStateSearchParams
} from './sidebar-url.utils';

function updateState(
	initial: URLSearchParams,
	updater: Parameters<typeof updateSidebarStateSearchParams>[1]
): URLSearchParams {
	const params = updateSidebarStateSearchParams(initial, updater);

	expect(params).not.toBeNull();
	if (!params) {
		throw new Error('Expected sidebar params to be updated');
	}

	return params;
}

describe('sidebar URL state', () => {
	it('registers every key exactly once with a unique alias', () => {
		const keys = SIDEBAR_KEY_REGISTRY.map(({ key }) => key);
		const aliases = SIDEBAR_KEY_REGISTRY.map(({ alias }) => alias);

		expect(new Set(keys).size).toBe(keys.length);
		expect(new Set(aliases).size).toBe(aliases.length);
	});

	it('stores sidebar state in compact v3 format and reads it through logical keys', () => {
		const params = updateState(new URLSearchParams(), (sidebarState) => {
			setSidebarStateValue(sidebarState, RUNS_SIDEBAR_KEYS.LAST_MODE, 'charts');
			setSidebarStateValue(sidebarState, RUNS_SIDEBAR_KEYS.SELECTED, [
				'11',
				'22'
			]);
			setSidebarStateValue(
				sidebarState,
				DASHBOARD_SIDEBAR_KEYS.LAST_URL,
				'/dashboard?project=1&mode=default&_s=old&filter=failed'
			);
		});

		const encodedState = params.get(SIDEBAR_STATE_PARAM);
		expect(encodedState).toBeTruthy();
		// Fixed-pathname URLs are stored as bare search strings.
		expect(decodeCompressedState<unknown>(encodedState ?? '')).toEqual([
			3,
			{
				du: 'filter=failed',
				rm: 'charts',
				rs: ['11', '22']
			}
		]);
		expect(getSidebarStateString(params, RUNS_SIDEBAR_KEYS.LAST_MODE)).toBe(
			'charts'
		);
		expect(
			getSidebarStateStringArray(params, RUNS_SIDEBAR_KEYS.SELECTED)
		).toEqual(['11', '22']);
		expect(getSidebarStateString(params, DASHBOARD_SIDEBAR_KEYS.LAST_URL)).toBe(
			'/dashboard?filter=failed'
		);
	});

	it('omits default-equal entries so default browsing produces no _s at all', () => {
		const params = updateSidebarStateSearchParams(
			new URLSearchParams(),
			(sidebarState) => {
				setSidebarStateValue(sidebarState, RUNS_SIDEBAR_KEYS.LAST_MODE, 'list');
				setSidebarStateValue(
					sidebarState,
					RUNS_SIDEBAR_KEYS.LAST_LIST,
					'/runs'
				);
				setSidebarStateValue(
					sidebarState,
					RUNS_SIDEBAR_KEYS.LAST_CHARTS,
					'/runs?mode=charts'
				);
				setSidebarStateValue(
					sidebarState,
					HISTORY_SIDEBAR_KEYS.LAST_MODE,
					'linear'
				);
				setSidebarStateValue(
					sidebarState,
					DASHBOARD_SIDEBAR_KEYS.LAST_URL,
					'/dashboard'
				);
			}
		);

		// Nothing survives encoding, so the params are unchanged.
		expect(params).toBeNull();
	});

	it('removes an existing _s when the state collapses to defaults', () => {
		const initial = updateState(new URLSearchParams(), (sidebarState) => {
			setSidebarStateValue(
				sidebarState,
				RUNS_SIDEBAR_KEYS.LAST_LIST,
				'/runs?page=2'
			);
		});

		const params = updateState(initial, (sidebarState) => {
			setSidebarStateValue(sidebarState, RUNS_SIDEBAR_KEYS.LAST_LIST, '/runs');
		});

		expect(params.get(SIDEBAR_STATE_PARAM)).toBeNull();
	});

	it('omits run and log URLs reconstructible from the current run id', () => {
		const params = updateState(new URLSearchParams(), (sidebarState) => {
			setSidebarStateValue(
				sidebarState,
				SHARED_SIDEBAR_KEYS.CURRENT_RUN_ID,
				'86793'
			);
			setSidebarStateValue(
				sidebarState,
				RUN_SIDEBAR_KEYS.LAST_DETAILS,
				'/runs/86793'
			);
			setSidebarStateValue(
				sidebarState,
				LOG_SIDEBAR_KEYS.LAST_LOG,
				'/log/86793'
			);
			setSidebarStateValue(
				sidebarState,
				RUN_SIDEBAR_KEYS.LAST_REPORT,
				'/runs/86793/report?config=5'
			);
		});

		expect(
			decodeCompressedState<unknown>(params.get(SIDEBAR_STATE_PARAM) ?? '')
		).toEqual([3, { cr: '86793', rr: '/runs/86793/report?config=5' }]);
	});

	it('keeps run-id-derived URLs pointing at their run after the current run changes', () => {
		// /runs/123 and /log/123 are omitted from _s while cr is '123'.
		const initial = updateState(new URLSearchParams(), (sidebarState) => {
			setSidebarStateValue(
				sidebarState,
				SHARED_SIDEBAR_KEYS.CURRENT_RUN_ID,
				'123'
			);
			setSidebarStateValue(
				sidebarState,
				RUN_SIDEBAR_KEYS.LAST_DETAILS,
				'/runs/123'
			);
			setSidebarStateValue(sidebarState, LOG_SIDEBAR_KEYS.LAST_LOG, '/log/123');
		});

		// Visiting another run's log rewrites cr without touching the run URLs.
		const params = updateState(initial, (sidebarState) => {
			setSidebarStateValue(
				sidebarState,
				SHARED_SIDEBAR_KEYS.CURRENT_RUN_ID,
				'456'
			);
			setSidebarStateValue(sidebarState, LOG_SIDEBAR_KEYS.LAST_LOG, '/log/456');
		});

		expect(getSidebarStateString(params, RUN_SIDEBAR_KEYS.LAST_DETAILS)).toBe(
			'/runs/123'
		);
		// The previously-omitted URL is now stored explicitly.
		expect(
			decodeCompressedState<unknown>(params.get(SIDEBAR_STATE_PARAM) ?? '')
		).toEqual([3, { cr: '456', rd: '/runs/123' }]);
	});

	it('preserves explicitly-empty query params through the compact round trip', () => {
		const params = updateState(new URLSearchParams(), (sidebarState) => {
			setSidebarStateValue(
				sidebarState,
				RUNS_SIDEBAR_KEYS.LAST_LIST,
				'/runs?tagExpr=&runData=abc'
			);
		});

		expect(getSidebarStateString(params, RUNS_SIDEBAR_KEYS.LAST_LIST)).toBe(
			'/runs?tagExpr=&runData=abc'
		);
	});

	it('isolates callers from the decode cache when they mutate arrays in place', () => {
		const params = updateState(new URLSearchParams(), (sidebarState) => {
			setSidebarStateValue(sidebarState, RUNS_SIDEBAR_KEYS.SELECTED, [
				'11',
				'22'
			]);
		});

		updateSidebarStateSearchParams(params, (sidebarState) => {
			const selected = sidebarState[RUNS_SIDEBAR_KEYS.SELECTED];
			if (Array.isArray(selected)) {
				selected.push('33');
			}
		});

		// Re-reading the same encoded value must not see the in-place push.
		expect(
			getSidebarStateStringArray(params, RUNS_SIDEBAR_KEYS.SELECTED)
		).toEqual(['11', '22']);
	});

	it('treats undecodable _s values as empty state instead of crashing', () => {
		const params = new URLSearchParams();
		params.set(SIDEBAR_STATE_PARAM, 'not-a-compressed-value');

		expect(
			getSidebarStateString(params, DASHBOARD_SIDEBAR_KEYS.LAST_URL)
		).toBeNull();
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

	it('strips recursive sidebar state, project params, and default mode but keeps explicitly-empty params', () => {
		expect(
			stripSidebarParamsFromUrl(
				'/runs?project=1&global.runs.lastMode=list&_s=old&mode=default&tagExpr=&runData=abc#section'
			)
		).toBe('/runs?tagExpr=&runData=abc#section');
	});

	it('keeps a realistic multi-feature state within a shareable length', () => {
		const params = updateState(new URLSearchParams(), (sidebarState) => {
			setSidebarStateValue(
				sidebarState,
				RUNS_SIDEBAR_KEYS.LAST_LIST,
				'/runs?startDate=2026-06-01&finishDate=2026-07-01&runData=label%3Dvalue&page=2'
			);
			setSidebarStateValue(
				sidebarState,
				RUNS_SIDEBAR_KEYS.LAST_CHARTS,
				'/runs?mode=charts&startDate=2026-06-01&finishDate=2026-07-01'
			);
			setSidebarStateValue(
				sidebarState,
				HISTORY_SIDEBAR_KEYS.LAST_LINEAR,
				'/history?testName=some_test_name&startDate=2026-06-01&finishDate=2026-07-01&results=PASSED&results=FAILED&page=1'
			);
			setSidebarStateValue(
				sidebarState,
				DASHBOARD_SIDEBAR_KEYS.LAST_URL,
				'/dashboard?date=2026-07-01'
			);
			setSidebarStateValue(
				sidebarState,
				SHARED_SIDEBAR_KEYS.CURRENT_RUN_ID,
				'86793'
			);
		});

		const encodedState = params.get(SIDEBAR_STATE_PARAM) ?? '';
		expect(encodedState.length).toBeGreaterThan(0);
		expect(encodedState.length).toBeLessThan(320);
	});

	it('prunes optional sidebar URLs to keep _s under budget', () => {
		// Pseudo-random payload — repetitive content would compress away and
		// never exceed the budget.
		let seed = 1;
		const noise = Array.from({ length: SIDEBAR_STATE_MAX_LENGTH * 3 }, () => {
			seed = (seed * 1103515245 + 12345) % 2147483648;
			return (seed % 36).toString(36);
		}).join('');
		const longUrl = `/dashboard?filter=${noise}`;
		const params = updateState(new URLSearchParams(), (sidebarState) => {
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
		});

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
