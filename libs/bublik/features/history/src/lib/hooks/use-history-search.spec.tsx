/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useSearchWriter } from '@/router';
import { renderHookWithRouter } from '@/router/testing';

import { useHistoryPagination } from './use-history-pagination';
import { useHistoryQuery } from './use-history-query';
import { useHistoryFromRun, useHistorySearch } from './use-history-search';

const BASEPATH = '/v2';

describe('useHistorySearch', () => {
	it.each(['/history', '/history/v2'])(
		'%s: reads the search through the shared history schema',
		async (path) => {
			const { result } = await renderHookWithRouter(
				() => useHistorySearch((search) => search),
				{
					path,
					search:
						'?testName=a+b&labels=&parameters=x%3D1%3By&untriaged=true&explained=' +
						'&mode=measurements-combined&combinedPlots=1%3B2&chart-group=trend' +
						'&parametersByResultName=n1&parametersByResultName=n2&fromRun=true'
				}
			);

			expect(result.current).toMatchObject({
				testName: 'a b',
				labels: [],
				parameters: ['x=1', 'y'],
				untriaged: true,
				explained: false,
				mode: 'measurements-combined',
				combinedPlots: ['1', '2'],
				'chart-group': 'trend',
				parametersByResultName: ['n1', 'n2'],
				fromRun: 'true'
			});
		}
	);

	it('fills no defaults', async () => {
		const { result } = await renderHookWithRouter(
			() => useHistorySearch((search) => [search.mode, search.page]),
			{ path: '/history' }
		);

		expect(result.current).toEqual([undefined, undefined]);
	});
});

describe('useHistoryQuery', () => {
	it('asks the API with each key in its wire spelling, as the query string carried it', async () => {
		const { result } = await renderHookWithRouter(() => useHistoryQuery(), {
			path: '/history',
			search:
				'?testName=suite%2Ftest&hash=&labels=&parameters=a%3D1%3Bb%3D2&runData=t1' +
				'&startDate=2026-01-01&finishDate=2026-04-01&runIds=1&runIds=2' +
				'&results=PASSED%3BFAILED&resultProperties=unexpected&verdictLookup=regex' +
				'&verdict=v&untriaged=true&explained=&issue=7&page=2&pageSize=50' +
				'&mode=aggregation&project=3&project=4&_s=abc'
		});

		expect(result.current.query).toEqual({
			testName: 'suite/test',
			hash: '',
			testArgs: 'a=1;b=2',
			revisions: undefined,
			branches: undefined,
			labels: '',
			tags: 't1',
			tagExpr: undefined,
			branchExpr: undefined,
			labelExpr: undefined,
			testArgExpr: undefined,
			revExpr: undefined,
			verdictExpr: undefined,
			fromDate: '2026-01-01',
			toDate: '2026-04-01',
			// The last of a repeated key, as `Object.fromEntries` read it.
			runIds: '2',
			resultTypes: 'unexpected',
			runProperties: undefined,
			resultStatuses: 'PASSED;FAILED',
			verdictLookup: 'regex',
			verdict: 'v',
			categories: undefined,
			issue: '7',
			untriaged: 'true',
			explained: '',
			page: '2',
			pageSize: '50',
			projects: [4]
		});
	});

	it('keeps the same query object while an unrelated key changes', async () => {
		const { result, router } = await renderHookWithRouter(
			() => ({ query: useHistoryQuery().query, write: useSearchWriter() }),
			{ path: '/history', search: '?testName=t&mode=linear' }
		);
		const before = result.current.query;

		act(() => result.current.write({ _s: 'abc' }));

		await waitFor(() =>
			expect(router.history.location.search).toBe(
				'?testName=t&mode=linear&_s=abc'
			)
		);
		expect(result.current.query).toBe(before);
	});
});

describe('useHistoryFromRun', () => {
	it('is true for a prefilled link from a run', async () => {
		const { result } = await renderHookWithRouter(() => useHistoryFromRun(), {
			path: '/history',
			search: '?testName=t&fromRun=true',
			state: { fromRun: true }
		});

		expect(result.current).toBe(true);
	});

	it.each([
		['a direct link', { fromRun: false }],
		['any other entry', undefined]
	])('is false for %s, the search param notwithstanding', async (_, state) => {
		const { result } = await renderHookWithRouter(() => useHistoryFromRun(), {
			path: '/history',
			search: '?testName=t&fromRun=true',
			state
		});

		expect(result.current).toBe(false);
	});
});

describe('useHistoryPagination', () => {
	it('reads page 1 of 25 by default', async () => {
		const { result } = await renderHookWithRouter(
			() => useHistoryPagination(),
			{ path: '/history', search: '?testName=t' }
		);

		expect(result.current.pagination).toEqual({ pageIndex: 0, pageSize: 25 });
	});

	it('pushes the page and page size, every other key kept, the hash and state dropped', async () => {
		const { result, router } = await renderHookWithRouter(
			() => useHistoryPagination(),
			{
				path: '/history/v2',
				search:
					'?testName=a+b&labels=&page=2&pageSize=50&mode=aggregation&project=1&_s=x',
				hash: 'top',
				state: { fromRun: false }
			}
		);
		const length = router.history.length;

		expect(result.current.pagination).toEqual({ pageIndex: 1, pageSize: 50 });

		act(() =>
			result.current.handlePaginationChange((prev) => ({
				...prev,
				pageIndex: prev.pageIndex + 1
			}))
		);

		await waitFor(() =>
			expect(router.history.location.href).toBe(
				`${BASEPATH}/history/v2?testName=a+b&labels=&page=3&pageSize=50&mode=aggregation&project=1&_s=x`
			)
		);
		expect(router.history.length).toBe(length + 1);
		expect(router.history.location.state).not.toHaveProperty('fromRun');

		act(() =>
			result.current.handlePaginationChange({ pageIndex: 0, pageSize: 100 })
		);

		await waitFor(() =>
			expect(router.history.location.search).toBe(
				'?testName=a+b&labels=&page=1&pageSize=100&mode=aggregation&project=1&_s=x'
			)
		);
		expect(router.history.length).toBe(length + 2);
	});

	it('appends page and page size when the link had none', async () => {
		const { result, router } = await renderHookWithRouter(
			() => useHistoryPagination(),
			{ path: '/history', search: '?testName=t&mode=linear' }
		);

		act(() =>
			result.current.handlePaginationChange({ pageIndex: 1, pageSize: 25 })
		);

		await waitFor(() =>
			expect(router.history.location.search).toBe(
				'?testName=t&mode=linear&page=2&pageSize=25'
			)
		);
	});
});
