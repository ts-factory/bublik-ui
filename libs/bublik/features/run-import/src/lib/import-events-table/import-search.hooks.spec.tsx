/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderHookWithRouter } from '@/router/testing';

import {
	useImportEventQueryParams,
	useImportLogExpanded,
	useImportTaskLogSearch
} from './import-search.hooks';
import { importSearch } from '@/shared/utils';

vi.mock('@/bublik/features/analytics', () => ({
	analyticsEventNames: {},
	trackEvent: vi.fn()
}));

const PAGE = (pageIndex: number, pageSize = 25) =>
	encodeURIComponent(JSON.stringify({ pageIndex, pageSize }));

function renderAt<R>(hook: () => R, search: string) {
	return renderHookWithRouter(hook, {
		path: '/admin/import',
		search,
		state: { fromRun: true },
		route: { id: '/_app/admin/import', search: importSearch }
	});
}

describe('useImportEventQueryParams (replaceIn)', () => {
	it('reads absent or unusable filters and pagination as the defaults', async () => {
		const { result } = await renderAt(
			useImportEventQueryParams,
			'?filters=null&pagination=not-json'
		);

		expect(result.current.query).toEqual({
			job: undefined,
			run: undefined,
			url: undefined,
			celery_task: undefined,
			status: undefined
		});
		expect(result.current.pagination).toEqual({ pageIndex: 0, pageSize: 25 });
	});

	it('writes the pagination as JSON, replacing the entry and keeping the state', async () => {
		const { router, result } = await renderAt(
			useImportEventQueryParams,
			'?_s=abc'
		);
		const length = router.history.length;

		await act(async () =>
			result.current.setPagination((old) => ({ ...old, pageIndex: 2 }))
		);

		expect(router.history.location.href).toBe(
			`/v2/admin/import?_s=abc&pagination=${PAGE(2)}`
		);
		expect(router.history.length).toBe(length);
		expect(router.history.location.state).toMatchObject({ fromRun: true });
	});

	it('builds a second update in one handler on the first', async () => {
		const { router, result } = await renderAt(useImportEventQueryParams, '');

		await act(async () => {
			result.current.setPagination((old) => ({ ...old, pageSize: 50 }));
			result.current.setPagination((old) => ({
				...old,
				pageIndex: old.pageIndex + 1
			}));
		});

		expect(router.history.location.href).toBe(
			`/v2/admin/import?pagination=${PAGE(1, 50)}`
		);
	});

	it('a filter change writes the filters and goes back to the first page', async () => {
		const { router, result } = await renderAt(
			useImportEventQueryParams,
			`?pagination=${PAGE(3, 50)}&_s=abc`
		);

		await act(async () =>
			result.current.setQuery({ url: 'https://x', status: undefined })
		);

		expect(router.history.location.href).toBe(
			`/v2/admin/import?pagination=${PAGE(
				0,
				50
			)}&_s=abc&filters=${encodeURIComponent('{"url":"https://x"}')}`
		);
	});

	it('a reset writes filters={}', async () => {
		const { router, result } = await renderAt(
			useImportEventQueryParams,
			`?filters=${encodeURIComponent('{"url":"u"}')}&pagination=${PAGE(2)}`
		);

		await act(async () => result.current.onResetClick());

		expect(router.history.location.href).toBe(
			`/v2/admin/import?filters=%7B%7D&pagination=${PAGE(0)}`
		);
	});
});

describe('useImportLogExpanded', () => {
	it('hands an updater the latest rows, absent included', async () => {
		const { router, result } = await renderAt(useImportLogExpanded, '');

		expect(result.current.expanded).toEqual({});

		await act(async () =>
			result.current.setExpanded((old) => ({
				...(old as Record<string, boolean>),
				'3': true
			}))
		);

		expect(router.history.location.href).toBe(
			'/v2/admin/import?expanded=%7B%223%22%3Atrue%7D'
		);
		expect(result.current.expanded).toEqual({ '3': true });
	});
});

describe('useImportTaskLogSearch (admin-import.feature)', () => {
	it('reads ?taskId=…&poll=1 as an open, polling log', async () => {
		const { result } = await renderAt(
			useImportTaskLogSearch,
			'?taskId=abc&poll=1'
		);

		expect(result.current.taskId).toBe('abc');
		expect(result.current.enablePolling).toBe(true);
	});

	it('opens a task log with its polling flag in one replace', async () => {
		const { router, result } = await renderAt(
			useImportTaskLogSearch,
			'?_s=abc'
		);
		const length = router.history.length;

		await act(async () => result.current.toggle('t1', true));
		expect(router.history.location.href).toBe(
			'/v2/admin/import?_s=abc&taskId=t1&poll=1'
		);

		await act(async () => result.current.toggle('t1', false));
		expect(router.history.location.href).toBe('/v2/admin/import?_s=abc&poll=0');
		expect(router.history.length).toBe(length);
	});

	it('leaves poll alone when the toggle names no polling flag', async () => {
		const { router, result } = await renderAt(
			useImportTaskLogSearch,
			'?poll=1'
		);

		await act(async () => result.current.toggle('t1'));

		expect(router.history.location.href).toBe(
			'/v2/admin/import?poll=1&taskId=t1'
		);
	});

	it('closing drops the task and the polling flag together', async () => {
		const { router, result } = await renderAt(
			useImportTaskLogSearch,
			'?taskId=abc&poll=1&_s=abc'
		);

		await act(async () => result.current.close());

		expect(router.history.location.href).toBe('/v2/admin/import?_s=abc');
		expect(result.current.taskId).toBeUndefined();
		expect(result.current.enablePolling).toBe(false);
	});
});
