/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { act, waitFor } from '@testing-library/react';
import { parseDate } from '@internationalized/date';
import { describe, expect, it, vi } from 'vitest';

import {
	RUNS_SIDEBAR_KEYS,
	getSidebarStateStringArray,
	updateSidebarStateSearchParams
} from '@/bublik/features/sidebar';
import { renderHookWithRouter, type TestRouter } from '@/router/testing';

import {
	useRunDataWriter,
	useRunsFormWriter,
	useRunsPagination,
	useRunsQuery,
	useRunsSelection
} from './hooks';
import type { RunsFormValues } from './runs-form/runs-form.component';
import { RUNS_ROUTE } from './testing/runs-route';

vi.mock('react-redux', () => ({
	useDispatch: () => vi.fn(),
	useSelector: () => []
}));

const BASE =
	'startDate=2026-04-20&finishDate=2026-04-20&calendarMode=default&mode=table';

/** The address bar, basepath included. */
const hrefOf = (router: TestRouter) => router.history.location.href;

/** A query string carrying `selected` as the runs selection in `_s`. */
function withSelection(selected: string[]): string {
	return (
		updateSidebarStateSearchParams(new URLSearchParams(), (sidebarState) => {
			sidebarState[RUNS_SIDEBAR_KEYS.SELECTED] = selected;
		})?.toString() ?? ''
	);
}

function selectionOf(router: TestRouter): string[] {
	return getSidebarStateStringArray(
		new URLSearchParams(router.history.location.search),
		RUNS_SIDEBAR_KEYS.SELECTED
	);
}

function form(values: Partial<RunsFormValues> = {}): RunsFormValues {
	return {
		calendarMode: 'default',
		dates: null,
		runData: [],
		tagExpr: '',
		...values
	};
}

describe('useRunsPagination', () => {
	it('reads the 1-based page and the page size, 1 and 25 when absent', async () => {
		const { result, router } = await renderHookWithRouter(useRunsPagination, {
			path: '/runs',
			search: BASE,
			route: RUNS_ROUTE
		});

		expect(result.current.pagination).toEqual({ pageIndex: 0, pageSize: 25 });

		// Never awaited inside `act`: fire it and wait for the render.
		void router.navigate({
			to: '/runs',
			search: { page: '3', pageSize: '50' }
		});

		await waitFor(() =>
			expect(result.current.pagination).toEqual({ pageIndex: 2, pageSize: 50 })
		);
	});

	it('pushes the page and page size after all the current keys, dropping the hash', async () => {
		const { result, router } = await renderHookWithRouter(useRunsPagination, {
			path: '/runs',
			search: `${BASE}&_s=abc&project=1`,
			hash: 'top',
			route: RUNS_ROUTE
		});
		const length = router.history.length;

		await act(async () =>
			result.current.handlePaginationChange({ pageIndex: 1, pageSize: 25 })
		);

		expect(hrefOf(router)).toBe(
			`/v2/runs?${BASE}&_s=abc&project=1&page=2&pageSize=25`
		);
		expect(router.history.length).toBe(length + 1);
	});

	it('keeps the page keys in their place and applies a functional update', async () => {
		const { result, router } = await renderHookWithRouter(useRunsPagination, {
			path: '/runs',
			search: `page=2&pageSize=50&${BASE}`,
			route: RUNS_ROUTE
		});

		await act(async () =>
			result.current.handlePaginationChange((old) => ({
				...old,
				pageIndex: old.pageIndex + 1
			}))
		);

		expect(hrefOf(router)).toBe(`/v2/runs?page=3&pageSize=50&${BASE}`);
	});
});

describe('useRunDataWriter', () => {
	it('writes the run data sorted and deduplicated, back on page 1, replacing the entry', async () => {
		const { result, router } = await renderHookWithRouter(useRunDataWriter, {
			path: '/runs',
			search: `${BASE}&page=3&pageSize=50`,
			route: RUNS_ROUTE
		});
		const length = router.history.length;

		await act(async () => result.current(['os=linux', 'arch=x86', 'os=linux']));

		expect(hrefOf(router)).toBe(
			`/v2/runs?${BASE}&page=1&pageSize=50&runData=arch%3Dx86%3Bos%3Dlinux`
		);
		expect(router.history.length).toBe(length);
	});

	it('drops the run data when no badge is left', async () => {
		const { result, router } = await renderHookWithRouter(useRunDataWriter, {
			path: '/runs',
			search: `${BASE}&runData=os%3Dlinux&page=2`,
			route: RUNS_ROUTE
		});

		await act(async () => result.current([]));

		expect(hrefOf(router)).toBe(`/v2/runs?${BASE}&page=1`);
	});
});

describe('useRunsFormWriter', () => {
	it('submits over all the current keys: dates, tag expression, run data, page 1, projects last', async () => {
		const { result, router } = await renderHookWithRouter(useRunsFormWriter, {
			path: '/runs',
			search: `project=7&${BASE}&page=3&pageSize=50&_s=abc&hide-sidebar=1`,
			hash: 'top',
			route: RUNS_ROUTE
		});
		const length = router.history.length;

		await act(async () =>
			result.current(
				form({
					dates: {
						start: parseDate('2026-04-01'),
						end: parseDate('2026-04-02')
					},
					tagExpr: 'linux',
					runData: [
						{ label: 'b=2', value: 'b=2', isSelected: true },
						{ label: 'a=1', value: 'a=1', isSelected: true },
						{ label: 'c=3', value: 'c=3', isSelected: false }
					]
				})
			)
		);

		expect(hrefOf(router)).toBe(
			'/v2/runs?startDate=2026-04-01&finishDate=2026-04-02&calendarMode=default&mode=table' +
				'&page=1&pageSize=50&_s=abc&hide-sidebar=1&tagExpr=linux&runData=a%3D1%3Bb%3D2&project=7'
		);
		expect(router.history.length).toBe(length);
	});

	it('removes both dates, the tag expression and the run data the form cleared', async () => {
		const { result, router } = await renderHookWithRouter(useRunsFormWriter, {
			path: '/runs',
			search: `${BASE}&tagExpr=linux&runData=a%3D1&page=2`,
			route: RUNS_ROUTE
		});

		await act(async () => result.current(form()));

		expect(hrefOf(router)).toBe(
			'/v2/runs?calendarMode=default&mode=table&page=1'
		);
	});

	it('keeps the duration on submit and drops it on reset, keeping the calendar mode', async () => {
		const search = 'calendarMode=duration&duration=P7D&mode=table';
		const submit = await renderHookWithRouter(useRunsFormWriter, {
			path: '/runs',
			search,
			route: RUNS_ROUTE
		});

		await act(async () =>
			submit.result.current(form({ calendarMode: 'duration' }))
		);

		expect(hrefOf(submit.router)).toBe(
			'/v2/runs?calendarMode=duration&duration=P7D&mode=table&page=1'
		);

		const reset = await renderHookWithRouter(useRunsFormWriter, {
			path: '/runs',
			search,
			route: RUNS_ROUTE
		});

		await act(async () =>
			reset.result.current(form({ calendarMode: 'duration' }), {
				dropDuration: true
			})
		);

		expect(hrefOf(reset.router)).toBe(
			'/v2/runs?calendarMode=duration&mode=table&page=1'
		);
	});
});

describe('useRunsQuery', () => {
	it('sends the dates, the page, the tag expression and the normalized run data', async () => {
		const { result } = await renderHookWithRouter(useRunsQuery, {
			path: '/runs',
			search: `${BASE}&page=2&pageSize=50&tagExpr=linux&runData=os%3A%20linux%3Barch%3Dx86&project=3`,
			route: RUNS_ROUTE
		});

		expect(result.current.query).toEqual({
			startDate: '2026-04-20',
			finishDate: '2026-04-20',
			page: '2',
			pageSize: '50',
			runData: 'os=linux;arch=x86',
			tagExpr: 'linux',
			projects: [3]
		});
	});
});

describe('useRunsSelection', () => {
	it('reads the selection from the compressed sidebar state', async () => {
		const { result } = await renderHookWithRouter(useRunsSelection, {
			path: '/runs',
			search: `${BASE}&${withSelection(['1', '2'])}`,
			route: RUNS_ROUTE
		});

		expect(result.current.compareIds).toEqual(['1', '2']);
		expect(result.current.rowSelection).toEqual({ 1: true, 2: true });
	});

	it('adds, replaces and removes runs in `_s` with a replace, writing no plain key', async () => {
		const { result, router } = await renderHookWithRouter(useRunsSelection, {
			path: '/runs',
			search: BASE,
			route: RUNS_ROUTE
		});
		const length = router.history.length;

		await act(async () => result.current.addSelection('1'));
		await act(async () => result.current.addSelection('2'));
		expect(selectionOf(router)).toEqual(['1', '2']);

		await act(async () => result.current.replaceSelection('1', '3'));
		expect(selectionOf(router)).toEqual(['2', '3']);

		await act(async () => result.current.removeSelection('2'));
		expect(selectionOf(router)).toEqual(['3']);

		const params = new URLSearchParams(router.history.location.search);
		expect([...params.keys()]).toEqual([
			'startDate',
			'finishDate',
			'calendarMode',
			'mode',
			'_s'
		]);
		expect(router.history.length).toBe(length);
	});

	it('drops `_s` altogether when the reset leaves it empty', async () => {
		const { result, router } = await renderHookWithRouter(useRunsSelection, {
			path: '/compare',
			search: `left=1&right=2&${withSelection(['1', '2'])}`
		});

		await act(async () => result.current.resetSelection());

		expect(hrefOf(router)).toBe('/v2/compare?left=1&right=2');
	});
});
