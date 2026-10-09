/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { configureStore } from '@reduxjs/toolkit';
import { createMemoryHistory } from '@tanstack/react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { config } from '@/bublik/config';
import { bublikAPI } from '@/services/bublik-api';

import { createAppRouter } from '../router';

function createTestStore() {
	return configureStore({
		reducer: { [bublikAPI.reducerPath]: bublikAPI.reducer },
		middleware: (getDefaultMiddleware) =>
			getDefaultMiddleware({ serializableCheck: false }).concat(
				bublikAPI.middleware
			)
	});
}

type TestStore = ReturnType<typeof createTestStore>;

/** `path?query` of every request sent, in order. */
const requested: string[] = [];

beforeEach(() => {
	requested.length = 0;
	vi.stubGlobal('scrollTo', vi.fn());

	// `fetchBaseQuery` builds a `Request` from a relative path, which Node only
	// takes as an absolute URL, and with jsdom's `AbortSignal`, which Node's
	// `Request` rejects.
	const NodeRequest = globalThis.Request;
	vi.stubGlobal(
		'Request',
		class extends NodeRequest {
			constructor(input: RequestInfo | URL, init?: RequestInit) {
				const { signal: _signal, ...rest } = init ?? {};

				super(
					typeof input === 'string'
						? new URL(input, 'http://localhost')
						: input,
					rest
				);
			}
		}
	);
	vi.stubGlobal(
		'fetch',
		vi.fn(async (request: Request) => {
			const { pathname, search } = new URL(request.url);
			requested.push(`${pathname}${search}`);

			// An answer the endpoints handle as an error: the loaders only have
			// to start the requests, and the page shows what comes back.
			return new Response('{}', {
				status: 404,
				headers: { 'Content-Type': 'application/json' }
			});
		})
	);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

async function routerAt(url: string) {
	const store = createTestStore();
	const router = createAppRouter(
		createMemoryHistory({ initialEntries: [`${config.baseUrl}${url}`] }),
		{ store }
	);
	await router.load();

	return { router, store };
}

/** The cache entries no component subscribes to: all of them, after a preload. */
function subscriptionCount(store: TestStore): number {
	const { subscriptions } = store.getState()[bublikAPI.reducerPath];

	return Object.values(subscriptions).reduce(
		(count, entry) => count + Object.keys(entry ?? {}).length,
		0
	);
}

const sent = (fragment: string) =>
	requested.some((request) => request.includes(fragment));

describe('route loaders prefetch the first request of a page', () => {
	it('loads the current user and the server features with the app', async () => {
		await routerAt('/help/faq');

		expect(sent('/auth/profile/info/')).toBe(true);
		expect(sent('/server/features')).toBe(true);
	});

	it.each([
		{
			name: 'the run page: its details',
			target: { to: '/runs/$runId', params: { runId: 7 } } as const,
			requests: ['/runs/7/details'],
			cached: (store: TestStore) =>
				bublikAPI.endpoints.getRunDetails.select('7')(store.getState())
		},
		{
			name: 'the run report: the report of its config',
			target: {
				to: '/runs/$runId/report',
				params: { runId: 7 },
				search: { config: 11 }
			} as const,
			requests: ['/report/7/?config=11'],
			cached: (store: TestStore) =>
				bublikAPI.endpoints.getRunReport.select({ runId: 7, configId: 11 })(
					store.getState()
				)
		},
		{
			name: 'the log: the run details and the tree',
			target: { to: '/log/$runId', params: { runId: 7 } } as const,
			requests: ['/runs/7/details', '/tree/7'],
			cached: (store: TestStore) =>
				bublikAPI.endpoints.getTreeByRunId.select('7')(store.getState())
		},
		{
			name: 'an issue: the issue in the selected project',
			target: {
				to: '/issues/$issueId',
				params: { issueId: 5 },
				search: { project: [3] }
			} as const,
			requests: ['/issues/5/?project=3'],
			cached: (store: TestStore) =>
				bublikAPI.endpoints.getIssue.select({ issueId: 5, projectId: 3 })(
					store.getState()
				)
		},
		{
			// Not its tables: they refetch on mount, a prefetch would double them
			name: 'the dashboard: its default mode',
			target: { to: '/dashboard', search: { project: [3] } } as const,
			requests: ['/dashboard/default_mode'],
			cached: (store: TestStore) =>
				bublikAPI.endpoints.getDashboardMode.select()(store.getState())
		}
	])(
		'$name, on intent, without a subscription or a navigation',
		async ({ target, requests, cached }) => {
			const { router, store } = await routerAt('/help/faq');
			requested.length = 0;

			await router.preloadRoute(target);

			for (const request of requests)
				expect(requested).toContainEqual(expect.stringContaining(request));
			// The entry the page reads is there, so it renders from the cache.
			expect(cached(store).isUninitialized).toBe(false);
			// No subscription: the entry expires by keepUnusedDataFor.
			expect(subscriptionCount(store)).toBe(0);
			// A preload never touches the address.
			expect(router.history.location.href).toBe(`${config.baseUrl}/help/faq`);
			expect(router.history.length).toBe(1);
		}
	);

	it('preloads 50 ms after intent and shows the route spinner only after a second', () => {
		const router = createAppRouter(createMemoryHistory(), {
			store: createTestStore()
		});

		expect(router.options).toMatchObject({
			defaultPreload: 'intent',
			defaultPreloadDelay: 50,
			// RTK Query owns freshness
			defaultPreloadStaleTime: 0,
			defaultPendingMs: 1000,
			defaultPendingMinMs: 500
		});
		expect(router.options.defaultPendingComponent).toBeDefined();
	});

	it('does not prefetch a report without a config', async () => {
		const { router } = await routerAt('/help/faq');
		requested.length = 0;

		await router.preloadRoute({
			to: '/runs/$runId/report',
			params: { runId: 7 }
		});

		expect(sent('/report/')).toBe(false);
	});

	it('does not prefetch for an id that is not a number', async () => {
		const { router } = await routerAt('/help/faq');
		requested.length = 0;

		await router.preloadRoute({ href: '/runs/abc' });

		expect(sent('/runs/')).toBe(false);
	});
});
