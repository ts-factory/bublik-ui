/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
	RUNS_SIDEBAR_KEYS,
	getSidebarStateString,
	updateSidebarStateSearchParams
} from '@/bublik/features/sidebar';
import { renderHookWithRouter } from '@/router/testing';

import { useRunsSidebarState } from './use-runs-sidebar-state';

/** `_s` carrying `state`, as a query string. */
function sidebarState(state: Record<string, string | string[]>): string {
	return (
		updateSidebarStateSearchParams(new URLSearchParams(), (sidebar) => {
			Object.assign(sidebar, state);
		})?.toString() ?? ''
	);
}

describe('useRunsSidebarState', () => {
	it('builds the mode links from the runs list on screen, without the sidebar state or projects', async () => {
		const { result } = await renderHookWithRouter(useRunsSidebarState, {
			path: '/runs',
			search: `mode=table&startDate=2026-04-20&tagExpr=a%20b&${sidebarState({
				[RUNS_SIDEBAR_KEYS.SELECTED]: ['1', '2']
			})}&project=7`
		});

		expect(result.current.listUrl).toBe(
			'/runs?startDate=2026-04-20&tagExpr=a+b'
		);
		expect(result.current.chartsUrl).toBe(
			'/runs?mode=charts&startDate=2026-04-20&tagExpr=a+b'
		);
		expect(result.current.progressUrl).toBe(
			'/runs?mode=progress&startDate=2026-04-20&tagExpr=a+b'
		);
		expect(result.current.compareUrl).toBe('/compare?left=1&right=2');
		expect(result.current.multipleUrl).toBe('/multiple?runIds=1&runIds=2');
	});

	it('falls back to the remembered list away from the runs list', async () => {
		const { result } = await renderHookWithRouter(useRunsSidebarState, {
			path: '/compare',
			search: `left=1&right=2&${sidebarState({
				[RUNS_SIDEBAR_KEYS.LAST_LIST]: '/runs?tagExpr=x'
			})}`
		});

		expect(result.current.listUrl).toBe('/runs?tagExpr=x');
		expect(result.current.chartsUrl).toBe('/runs?mode=charts');
		expect(result.current.compareUrl).toBeNull();
	});

	it('remembers the last list URL in `_s` with a replace', async () => {
		const { result, router } = await renderHookWithRouter(useRunsSidebarState, {
			path: '/runs',
			search: 'tagExpr=x&project=7'
		});
		const length = router.history.length;

		await act(async () =>
			result.current.setLastVisited('list', '/runs?tagExpr=x&project=7')
		);

		const params = new URLSearchParams(router.history.location.search);
		expect(getSidebarStateString(params, RUNS_SIDEBAR_KEYS.LAST_LIST)).toBe(
			'/runs?tagExpr=x'
		);
		expect(router.history.length).toBe(length);
	});
});
