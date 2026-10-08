/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/**
 * Test fixture for the compat shims: a small router shaped like the app's
 * (basepath `/v2`, raw search codec, `defineSearch` schemas on the root and
 * on `/runs`) on a memory history, mounted through `RouterProvider`. The
 * shims are observed through the router's location only.
 */
import { act, render, renderHook } from '@testing-library/react';
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
	RouterProvider
} from '@tanstack/react-router';
import type { ReactElement, ReactNode } from 'react';

import {
	bool01,
	compressedJson,
	enumOf,
	json,
	num,
	passthrough,
	repeated,
	repeatedNum,
	str
} from '../lib/search/codecs';
import { useLocation } from '../lib/compat/navigation';
import { defineSearch } from '../lib/search/define-search';
import { parseSearch, stringifySearch } from '../lib/search/wire';

const rootSearch = defineSearch({
	project: repeatedNum(),
	_s: str(),
	'hide-sidebar': passthrough(),
	'settings-open': bool01(),
	'settings-tab': enumOf(['account', 'appearance', 'beta', 'preferences'])
});

const runsSearch = defineSearch({
	page: num(),
	mode: enumOf(['table', 'charts', 'progress']),
	tv: bool01(),
	expanded: compressedJson<Record<string, boolean>>(),
	columnOrder: json<string[]>(),
	globalRequirements: repeated()
});

/**
 * Holds `/slow`'s loader until the test calls `release()`, so a navigation
 * can be observed while the previous page is still the one rendered.
 */
function createGate() {
	let release: () => void = () => undefined;
	const promise = new Promise<void>((resolve) => {
		release = resolve;
	});

	return { promise, release: () => release() };
}

let slowGate = createGate();

/** What `/slow`'s page saw on each of its renders, oldest first. */
const slowPageRenders: { pathname: string; state: unknown }[] = [];

function SlowPage() {
	const { pathname, state } = useLocation();
	slowPageRenders.push({ pathname, state });

	return null;
}

/** A fresh gate for `/slow`'s loader; returns its `release`. */
function holdSlowRoute(): () => void {
	slowGate = createGate();

	return slowGate.release;
}

function createCompatRouter(
	initialEntries: string[],
	component?: () => ReactElement
) {
	const root = createRootRoute({
		validateSearch: rootSearch.validateSearch,
		search: { middlewares: rootSearch.middlewares },
		component: component ?? Outlet
	});
	const children = [
		createRoute({ getParentRoute: () => root, path: '/dashboard' }),
		createRoute({
			getParentRoute: () => root,
			path: '/runs',
			validateSearch: runsSearch.validateSearch,
			search: { middlewares: runsSearch.middlewares }
		}),
		createRoute({ getParentRoute: () => root, path: '/runs/$runId' }),
		createRoute({ getParentRoute: () => root, path: '/runs/$runId/report' }),
		createRoute({ getParentRoute: () => root, path: '/log/$runId' }),
		createRoute({ getParentRoute: () => root, path: '/issues/$issueId' }),
		createRoute({ getParentRoute: () => root, path: '/auth/login' }),
		createRoute({
			getParentRoute: () => root,
			path: '/slow',
			loader: () => slowGate.promise,
			component: SlowPage
		})
	];

	return createRouter({
		routeTree: root.addChildren(children),
		history: createMemoryHistory({
			initialEntries: initialEntries.map((entry) => `/v2${entry}`)
		}),
		basepath: '/v2',
		trailingSlash: 'preserve',
		caseSensitive: false,
		parseSearch,
		stringifySearch,
		search: { strict: false },
		defaultStructuralSharing: true,
		defaultPreload: false,
		scrollRestoration: false
	});
}

type CompatRouter = ReturnType<typeof createCompatRouter>;

/** Mounts a hook under the router at `url` (or the last of several entries). */
async function renderHookAt<T>(url: string | string[], hook: () => T) {
	const router = createCompatRouter(Array.isArray(url) ? url : [url]);
	await router.load();

	// `renderHook` hands the wrapper one element: the hook's host component.
	function Wrapper({ children }: { children: ReactNode }) {
		return (
			<RouterProvider
				router={router}
				defaultComponent={() => children as ReactElement}
			/>
		);
	}

	const rendered = renderHook(hook, { wrapper: Wrapper });

	return { router, ...rendered };
}

/** Mounts `ui` as the root component under the router at `url`. */
async function renderAt(url: string | string[], ui: ReactElement) {
	const router = createCompatRouter(Array.isArray(url) ? url : [url], () => ui);
	await router.load();

	const rendered = render(<RouterProvider router={router} />);

	return { router, ...rendered };
}

/** The location the memory history holds, under the basepath. */
const hrefOf = (router: CompatRouter) => router.history.location.href;

/** Runs a shim write and lets the router commit it. */
async function write(run: () => void) {
	await act(async () => {
		run();
	});
}

export {
	createCompatRouter,
	holdSlowRoute,
	hrefOf,
	slowPageRenders,
	renderAt,
	renderHookAt,
	write
};
export type { CompatRouter };
