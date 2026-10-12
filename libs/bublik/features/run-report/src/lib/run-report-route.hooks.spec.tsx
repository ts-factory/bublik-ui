/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { act, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
	renderHookWithRouter,
	type RenderWithRouterOptions
} from '@/router/testing';

import {
	RUN_REPORT_ROUTE_ID,
	useRunReportAnchorNavigation,
	useRunReportBlockOpen,
	useRunReportConfigId,
	useRunReportFullMode,
	useRunReportHash,
	useRunReportRunId,
	useRunReportSearchString,
	useRunReportStackedSearch,
	useScrollToReportHash
} from './run-report-route.hooks';
import { runReportSearch } from '@/shared/utils';

function atReport<Result>(
	hook: () => Result,
	options: Omit<RenderWithRouterOptions, 'route'> = {}
) {
	return renderHookWithRouter(hook, {
		route: { id: RUN_REPORT_ROUTE_ID, search: runReportSearch },
		path: '/runs/7/report',
		...options
	});
}

/** `location.state` without the router's own keys (`key`, `__TSR_*`, `__hashScrollIntoViewOptions`). */
const userState = (state: object) =>
	Object.fromEntries(
		Object.entries(state).filter(
			([key]) => key !== 'key' && !key.startsWith('__')
		)
	);

describe('reading the report URL', () => {
	it('reads runId and config as numbers', async () => {
		const { result } = await atReport(
			() => ({ runId: useRunReportRunId(), config: useRunReportConfigId() }),
			{ search: '?config=11' }
		);

		expect(result.current).toEqual({ runId: 7, config: 11 });
	});

	it('reads a missing or garbled config as absent (the empty state)', async () => {
		const missing = await atReport(() => useRunReportConfigId());
		expect(missing.result.current).toBeUndefined();

		const garbled = await atReport(() => useRunReportConfigId(), {
			search: '?config=abc'
		});
		expect(garbled.result.current).toBeUndefined();
	});

	it('applies the defaults of absent keys', async () => {
		const { result } = await atReport(
			() => ({
				isFullMode: useRunReportFullMode()[0],
				stacked: useRunReportStackedSearch()
			}),
			{ search: '?config=11' }
		);

		expect(result.current.isFullMode).toBe(true);
		expect(result.current.stacked.selectedIds).toEqual([]);
		expect(result.current.stacked.isStackedOpen).toBe(false);
	});

	it('reads the wire values the e2e report links pin', async () => {
		const { result } = await atReport(
			() => ({
				isFullMode: useRunReportFullMode()[0],
				stacked: useRunReportStackedSearch()
			}),
			{
				search:
					'?config=11&isFullMode=0&selected-records=rec-1&selected-records=rec-2&stacked-drawer=1'
			}
		);

		expect(result.current.isFullMode).toBe(false);
		expect(result.current.stacked.selectedIds).toEqual(['rec-1', 'rec-2']);
		expect(result.current.stacked.isStackedOpen).toBe(true);
	});

	it('reads a block key as 1/0, anything else as the block default', async () => {
		const { result } = await atReport(
			() => ({
				collapsed: useRunReportBlockOpen('arg-val-block-7', true)[0],
				opened: useRunReportBlockOpen('measurement-3', false)[0],
				garbled: useRunReportBlockOpen('test-block-2', true)[0],
				absent: useRunReportBlockOpen('measurement-4', false)[0]
			}),
			{
				search: '?config=11&arg-val-block-7=0&measurement-3=1&test-block-2=true'
			}
		);

		expect(result.current).toEqual({
			collapsed: false,
			opened: true,
			garbled: true,
			absent: false
		});
	});

	it('reads the hash decoded by the router and the query string as is', async () => {
		const { result } = await atReport(
			() => ({ hash: useRunReportHash(), search: useRunReportSearchString() }),
			{ search: '?config=11&project=3', hash: 'arg-val-block%207' }
		);

		expect(result.current).toEqual({
			hash: 'arg-val-block 7',
			search: '?config=11&project=3'
		});
	});
});

describe('the report controls write a replace that merges (replaceIn)', () => {
	it('toggles isFullMode as 1/0, keeping the state, dropping the hash', async () => {
		const { result, router } = await atReport(() => useRunReportFullMode(), {
			search: '?config=11&selected-records=rec-1&project=3',
			hash: 'test-block-1',
			state: { fromRun: true }
		});
		const length = router.history.length;

		await act(async () => result.current[1](false));

		expect(router.history.location.href).toBe(
			'/v2/runs/7/report?config=11&selected-records=rec-1&project=3&isFullMode=0'
		);
		expect(router.history.length).toBe(length);
		expect(router.history.location.state).toMatchObject({ fromRun: true });
		expect(result.current[0]).toBe(false);

		await act(async () => result.current[1](true));

		expect(router.history.location.href).toBe(
			'/v2/runs/7/report?config=11&selected-records=rec-1&project=3&isFullMode=1'
		);
	});

	it('repeats selected-records once per id and drops the key when empty', async () => {
		const { result, router } = await atReport(
			() => useRunReportStackedSearch(),
			{ search: '?config=11&isFullMode=0' }
		);
		const length = router.history.length;

		await act(async () => result.current.setSelectedIds(['rec-1', 'rec-2']));

		expect(router.history.location.href).toBe(
			'/v2/runs/7/report?config=11&isFullMode=0&selected-records=rec-1&selected-records=rec-2'
		);

		await act(async () => result.current.setIsStackedOpen(true));

		expect(router.history.location.href).toBe(
			'/v2/runs/7/report?config=11&isFullMode=0&selected-records=rec-1&selected-records=rec-2&stacked-drawer=1'
		);

		await act(async () => result.current.setSelectedIds([]));

		expect(router.history.location.href).toBe(
			'/v2/runs/7/report?config=11&isFullMode=0&stacked-drawer=1'
		);
		expect(router.history.length).toBe(length);
	});

	it('writes a block key as 1/0, in place when it is already on the URL', async () => {
		const { result, router } = await atReport(
			() => ({
				test: useRunReportBlockOpen('test-block-2', true),
				measurement: useRunReportBlockOpen('measurement-3', false)
			}),
			{ search: '?config=11&test-block-2=1&selected-records=rec-1' }
		);
		const length = router.history.length;

		await act(async () => result.current.test[1](false));
		await act(async () => result.current.measurement[1](true));

		expect(router.history.location.href).toBe(
			'/v2/runs/7/report?config=11&test-block-2=0&selected-records=rec-1&measurement-3=1'
		);
		expect(router.history.length).toBe(length);
		expect(result.current.test[0]).toBe(false);
		expect(result.current.measurement[0]).toBe(true);
	});
});

describe('anchor navigation (keyboard and the TOC button)', () => {
	it('pushes the anchor with the whole current search, without state', async () => {
		const { result, router } = await atReport(
			() => useRunReportAnchorNavigation(),
			{
				search: '?config=11&isFullMode=0&project=3&_s=abc&test-block-2=0',
				hash: 'test-block-1',
				state: { fromRun: true }
			}
		);
		const length = router.history.length;

		await act(async () =>
			result.current(encodeURIComponent('arg-val-block 7'))
		);

		expect(router.history.location.href).toBe(
			'/v2/runs/7/report?config=11&isFullMode=0&project=3&_s=abc&test-block-2=0#arg-val-block%207'
		);
		expect(router.history.length).toBe(length + 1);
		expect(userState(router.history.location.state)).toEqual({});
	});

	it('lands on the route path without the legacy trailing slash (decision 13)', async () => {
		const { result, router } = await atReport(
			() => useRunReportAnchorNavigation(),
			{ path: '/runs/7/report/', search: '?config=11' }
		);

		await act(async () => result.current('run-report-table-of-contents'));

		expect(router.history.location.href).toBe(
			'/v2/runs/7/report?config=11#run-report-table-of-contents'
		);
	});
});

describe('scrolling to the anchored block', () => {
	let scroller: HTMLElement;

	function mountBlocks(ids: string[]) {
		scroller = document.createElement('div');
		scroller.id = 'page-container';
		scroller.scrollTo = vi.fn() as unknown as HTMLElement['scrollTo'];
		scroller.getBoundingClientRect = () => ({ top: 100 } as DOMRect);

		ids.forEach((id, index) => {
			const block = document.createElement('div');
			block.id = encodeURIComponent(id);
			block.dataset.offset = '36';
			block.getBoundingClientRect = () =>
				({ top: 100 + 1000 * (index + 1) } as DOMRect);
			scroller.appendChild(block);
		});

		document.body.appendChild(scroller);
	}

	afterEach(() => {
		scroller?.remove();
	});

	it('scrolls to the block a shared #anchor link names, on load', async () => {
		mountBlocks(['arg-val-block 7']);

		await atReport(() => useScrollToReportHash(), {
			search: '?config=11',
			hash: encodeURIComponent('arg-val-block 7')
		});

		await waitFor(() =>
			expect(scroller.scrollTo).toHaveBeenCalledWith({
				top: 964,
				behavior: 'smooth'
			})
		);
	});

	it('does not scroll without a hash', async () => {
		mountBlocks(['arg-val-block-7']);

		await atReport(() => useScrollToReportHash(), { search: '?config=11' });
		await new Promise((resolve) => requestAnimationFrame(resolve));

		expect(scroller.scrollTo).not.toHaveBeenCalled();
	});

	it('scrolls back to the previous anchor on Back', async () => {
		mountBlocks(['arg-val-block-1', 'arg-val-block-2']);

		const { result, router } = await atReport(
			() => {
				useScrollToReportHash();

				return useRunReportAnchorNavigation();
			},
			{ search: '?config=11' }
		);

		await act(async () => result.current('arg-val-block-1'));
		await act(async () => result.current('arg-val-block-2'));
		await waitFor(() =>
			expect(scroller.scrollTo).toHaveBeenLastCalledWith({
				top: 1964,
				behavior: 'smooth'
			})
		);

		await act(async () => router.history.back());

		await waitFor(() =>
			expect(router.history.location.href).toBe(
				'/v2/runs/7/report?config=11#arg-val-block-1'
			)
		);
		await waitFor(() =>
			expect(scroller.scrollTo).toHaveBeenLastCalledWith({
				top: 964,
				behavior: 'smooth'
			})
		);
	});
});
