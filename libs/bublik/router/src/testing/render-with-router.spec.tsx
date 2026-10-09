/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { act, screen } from '@testing-library/react';
import { getRouteApi } from '@tanstack/react-router';
import { describe, expect, it } from 'vitest';

import '../lib/history-state';

import { useLocation } from '../lib/compat/navigation';
import { bool01, num } from '../lib/search/codecs';
import { defineSearch } from '../lib/search/define-search';
import { writeSearch } from '../lib/search/use-search-writer';
import { renderHookWithRouter, renderWithRouter } from './render-with-router';

function ShowLocation() {
	const { pathname, search, hash } = useLocation();

	return <output>{`${pathname}${search}${hash}`}</output>;
}

describe('renderWithRouter', () => {
	it('renders the component at the given path, search and hash', async () => {
		const { router } = await renderWithRouter(<ShowLocation />, {
			path: '/runs/42',
			search: '?page=2&project=7',
			hash: 'top'
		});

		expect(screen.getByRole('status').textContent).toBe(
			'/runs/42?page=2&project=7#top'
		);
		expect(router.history.location.href).toBe(
			'/v2/runs/42?page=2&project=7#top'
		);
	});

	it('seeds location.state', async () => {
		function ShowState() {
			return (
				<output>
					{String(useLocation<{ fromRun?: boolean }>().state.fromRun)}
				</output>
			);
		}

		const { router } = await renderWithRouter(<ShowState />, {
			path: '/history',
			state: { fromRun: true }
		});

		expect(screen.getByRole('status').textContent).toBe('true');
		expect(router.history.location.state).toMatchObject({ fromRun: true });
	});

	it('serializes typed root keys the way the app does', async () => {
		const { router } = await renderWithRouter(<ShowLocation />, {
			path: '/runs'
		});

		await act(async () => {
			writeSearch(router, { 'settings-open': true, project: [3, 4] });
		});

		expect(router.history.location.href).toBe(
			'/v2/runs?settings-open=1&project=3&project=4'
		);
		expect(screen.getByRole('status').textContent).toBe(
			'/runs?settings-open=1&project=3&project=4'
		);
	});
});

describe('a query string not in URLSearchParams form', () => {
	it('stays as typed on load, as React Router left it', async () => {
		const { router } = await renderWithRouter(<ShowLocation />, {
			path: '/issues',
			search: '?state=open;closed&q=a%20b'
		});

		expect(router.history.location.href).toBe(
			'/v2/issues?state=open;closed&q=a%20b'
		);
		expect(screen.getByRole('status').textContent).toBe(
			'/issues?state=open;closed&q=a%20b'
		);
	});

	it('is written in URLSearchParams form by the next write', async () => {
		const { router } = await renderWithRouter(<ShowLocation />, {
			path: '/issues',
			search: '?state=open;closed&q=a%20b'
		});

		await act(async () => writeSearch(router, { page: '2' }));

		expect(router.history.location.href).toBe(
			'/v2/issues?state=open%3Bclosed&q=a+b&page=2'
		);
	});
});

describe('renderHookWithRouter', () => {
	it('runs the hook at the URL and re-runs it with new props', async () => {
		const { router, result, rerender } = await renderHookWithRouter(
			({ label }: { label: string }) => ({ label, location: useLocation() }),
			{ path: '/issues', search: 'state=open', initialProps: { label: 'a' } }
		);

		expect(result.current.location.search).toBe('?state=open');

		await act(async () => writeSearch(router, { page: '2' }));
		expect(result.current.location.search).toBe('?state=open&page=2');

		rerender({ label: 'b' });
		expect(result.current.label).toBe('b');
	});
});

describe('the route option', () => {
	const reportSearch = defineSearch({ config: num(), isFullMode: bool01() });
	const reportRoute = getRouteApi('/_app/runs/$runId/report');

	function ShowReportRoute() {
		const { runId } = reportRoute.useParams() as { runId: string };
		const search = reportRoute.useSearch() as Record<string, unknown>;

		return <output>{JSON.stringify({ runId, search })}</output>;
	}

	it('renders the page in a route of that id, with its params and typed search', async () => {
		await renderWithRouter(<ShowReportRoute />, {
			route: { id: '/_app/runs/$runId/report', search: reportSearch },
			path: '/runs/7/report',
			search: '?config=11&isFullMode=0&project=3'
		});

		expect(JSON.parse(screen.getByRole('status').textContent ?? '')).toEqual({
			runId: '7',
			search: { config: 11, isFullMode: false, project: [3] }
		});
	});

	it("serializes typed writes of the route's keys through its middleware", async () => {
		const { router } = await renderWithRouter(<ShowReportRoute />, {
			route: { id: '/_app/runs/$runId/report', search: reportSearch },
			path: '/runs/7/report',
			search: '?config=11'
		});

		await act(async () => writeSearch(router, { isFullMode: false }));

		expect(router.history.location.href).toBe(
			'/v2/runs/7/report?config=11&isFullMode=0'
		);
	});

	it('still renders the page on any other path', async () => {
		await renderWithRouter(<ShowLocation />, {
			route: { id: '/_app/runs/$runId/report', search: reportSearch },
			path: '/dashboard',
			search: '?mode=rows'
		});

		expect(screen.getByRole('status').textContent).toBe('/dashboard?mode=rows');
	});
});
