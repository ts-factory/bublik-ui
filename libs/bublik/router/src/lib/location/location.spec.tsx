/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { Outlet, useRouter, type AnyRouter } from '@tanstack/react-router';
import { describe, expect, it } from 'vitest';

import '../history-state';
import {
	holdSlowRoute,
	hrefOf,
	renderAt,
	renderHookAt,
	slowPageRenders,
	write
} from '../../test/memory-router';
import { writeSearch } from '../search/use-search-writer';
import { useLatestLocation, useRenderedLocation } from './location';

describe('useRenderedLocation: the location of the page on screen', () => {
	it('keeps the current page on its own location while the next one is still loading', async () => {
		const release = holdSlowRoute();
		const { router, result } = await renderHookAt(
			'/runs?page=2',
			useRenderedLocation
		);

		await write(() => void router.navigate({ href: '/slow?x=1' }));

		// The navigation is under way (the history already moved), but the
		// page still rendered must not see the next page's address.
		expect(hrefOf(router)).toBe('/v2/slow?x=1');
		expect(result.current.pathname).toBe('/runs');
		expect(result.current.searchStr).toBe('?page=2');

		await write(() => release());
	});

	it('a page mounted by a navigation sees its own location and state on its first render', async () => {
		const release = holdSlowRoute();
		slowPageRenders.length = 0;
		const { router } = await renderAt('/runs', <Outlet />);

		await write(
			() => void router.navigate({ to: '/slow', state: { fromRun: true } })
		);
		await write(() => release());

		expect(slowPageRenders[0]).toMatchObject({
			pathname: '/slow',
			state: { fromRun: true }
		});
	});

	it('follows an in-page search write as soon as it is committed', async () => {
		const { router, result } = await renderHookAt(
			'/runs?page=2',
			useRenderedLocation
		);

		await write(() => writeSearch(router, { page: 3 }));

		expect(result.current.searchStr).toBe('?page=3');
	});
});

describe('useLatestLocation: where a write must build its target', () => {
	it('returns the location of a navigation committed earlier in the same tick', async () => {
		const { router, result } = await renderHookAt('/runs?page=1', () => ({
			latest: useLatestLocation(),
			rendered: useRenderedLocation()
		}));

		await write(() => {
			writeSearch(router, { _s: 'abc' });

			// The render-time location and the window still say page=1 here;
			// the router already holds the write.
			expect(result.current.rendered.searchStr).toBe('?page=1');
			expect(result.current.latest().search).toBe('?page=1&_s=abc');

			writeSearch(router, { mode: 'charts' });
		});

		expect(hrefOf(router)).toBe('/v2/runs?page=1&_s=abc&mode=charts');
		expect(router.history.length).toBe(1);
	});

	it('a write built on it while the next page loads lands on that page instead of hijacking it', async () => {
		const release = holdSlowRoute();
		const { router, result } = await renderHookAt('/runs?page=2', () => ({
			router: useRouter<AnyRouter>(),
			latest: useLatestLocation()
		}));

		await write(() => void router.navigate({ href: '/slow?x=1#top' }));

		const latest = result.current.latest();
		expect(latest.pathname).toBe('/slow');
		expect(latest.search).toBe('?x=1');
		expect(latest.hash).toBe('#top');

		// What the sidebar writer does from the page that is still rendered.
		await write(
			() =>
				void result.current.router.navigate({
					href: `${latest.pathname}${latest.search}&_s=abc${latest.hash}`,
					replace: true,
					state: latest.state as Record<string, unknown>
				})
		);
		await write(() => release());

		expect(hrefOf(router)).toBe('/v2/slow?x=1&_s=abc#top');
	});

	it('is stable between renders', async () => {
		const { result, rerender } = await renderHookAt('/runs', useLatestLocation);
		const first = result.current;

		rerender();

		expect(result.current).toBe(first);
	});
});
