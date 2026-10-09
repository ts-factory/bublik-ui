/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { act } from '@testing-library/react';
import type { VisibilityState } from '@tanstack/react-table';
import { describe, expect, it } from 'vitest';

import { defineSearch, json, str } from '@/router';
import { renderHookWithRouter, type TestRoute } from '@/router/testing';

import {
	useCompareColumnVisibility,
	useCompareExpanded,
	useCompareRunIds
} from './compare-search';

/** `/compare` as `apps/bublik/src/routes/-search/compare.search.ts` wires it. */
const COMPARE_ROUTE: TestRoute = {
	id: '/_app/_runs/compare',
	search: defineSearch({
		left: str(),
		right: str(),
		expanded: json<Record<string, boolean>>(),
		columnVisibility: json<VisibilityState>()
	})
};

const PAIR = 'left=1132&right=1151';

function renderAt<Result>(hook: () => Result, search: string) {
	return renderHookWithRouter(hook, {
		path: '/compare',
		search,
		route: COMPARE_ROUTE
	});
}

describe('useCompareRunIds', () => {
	it('reads both sides raw', async () => {
		const { result } = await renderAt(useCompareRunIds, PAIR);

		expect(result.current).toEqual({ left: '1132', right: '1151' });
	});

	it('reads a missing side as absent', async () => {
		const { result } = await renderAt(useCompareRunIds, 'left=1132');

		expect(result.current).toEqual({ left: '1132', right: undefined });
	});
});

describe('useCompareExpanded', () => {
	it('opens the first row when the key is absent or not JSON', async () => {
		for (const search of [PAIR, `${PAIR}&expanded=%7Bnope`]) {
			const { result } = await renderAt(useCompareExpanded, search);

			expect(result.current[0]).toEqual({ '0': true });
		}
	});

	it('writes plain JSON after the current keys, replacing the entry and keeping the state', async () => {
		const { result, router } = await renderHookWithRouter(useCompareExpanded, {
			path: '/compare',
			search: `${PAIR}&_s=abc`,
			state: { fromRun: true },
			route: COMPARE_ROUTE
		});
		const length = router.history.length;

		await act(async () => result.current[1]({ '0': true, '0.1': true }));

		expect(router.history.location.href).toBe(
			`/v2/compare?${PAIR}&_s=abc&expanded=%7B%220%22%3Atrue%2C%220.1%22%3Atrue%7D`
		);
		expect(router.history.length).toBe(length);
		expect(router.history.location.state).toMatchObject({ fromRun: true });
		expect(result.current[0]).toEqual({ '0': true, '0.1': true });
	});

	it('hands a functional update the value on the latest location, so updates in one handler compose', async () => {
		const { result, router } = await renderAt(
			useCompareExpanded,
			`expanded=%7B%220%22%3Atrue%7D&${PAIR}`
		);

		await act(async () => {
			const setExpanded = result.current[1];
			setExpanded((old) => ({ ...(old as object), a: true }));
			setExpanded((old) => ({ ...(old as object), b: true }));
		});

		expect(router.history.location.href).toBe(
			`/v2/compare?expanded=%7B%220%22%3Atrue%2C%22a%22%3Atrue%2C%22b%22%3Atrue%7D&${PAIR}`
		);
	});
});

describe('useCompareColumnVisibility', () => {
	it('hides the TOTAL, RUN and ABNORMAL columns by default', async () => {
		const { result } = await renderAt(useCompareColumnVisibility, PAIR);

		expect(result.current[0]).toEqual({
			TOTAL_LEFT: false,
			TOTAL_RIGHT: false,
			RUN_LEFT: false,
			RUN_RIGHT: false,
			ABNORMAL_LEFT: false,
			ABNORMAL_RIGHT: false
		});
	});

	it('writes the columns as plain JSON', async () => {
		const { result, router } = await renderAt(useCompareColumnVisibility, PAIR);

		await act(async () => result.current[1]({ TOTAL_LEFT: true }));

		expect(router.history.location.href).toBe(
			`/v2/compare?${PAIR}&columnVisibility=%7B%22TOTAL_LEFT%22%3Atrue%7D`
		);
	});
});
