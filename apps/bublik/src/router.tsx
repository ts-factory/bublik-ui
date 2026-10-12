/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createRouter, type RouterHistory } from '@tanstack/react-router';

import { Spinner } from '@/shared/tailwind-ui';
import { config } from '@/bublik/config';
import { store } from '@/bublik/+state';
import { createSearchCodec } from '@/router';

import { RouteErrorBoundary } from './app/route-error-boundary';
import { NoMatchFeature } from './pages/not-found-page';
import type { RouterContext } from './routes/-loaders';
import { routeTree } from './routeTree.gen';

function RoutePending() {
	return <Spinner className="h-48" />;
}

/**
 * The TanStack router and its options. A factory rather than a
 * module-level instance: creating a browser history patches
 * `window.history.pushState`/`replaceState`, rewrites `history.state` and
 * registers a popstate listener on the spot, so it must happen once, where
 * the app mounts (`app/router.tsx`); the specs create their own on a memory
 * history.
 */
function createAppRouter(
	history?: RouterHistory,
	context: RouterContext = { store }
) {
	return createRouter({
		routeTree,
		history,
		// The route loaders prefetch into the RTK Query store.
		context,
		// '/v2' or '<prefix>/v2'
		basepath: config.baseUrl,
		// Never rewrite '/report/?config=' or '/activate/.../' on load.
		trailingSlash: 'preserve',
		caseSensitive: false,
		// URLSearchParams in, strings and string arrays out, byte-identical
		// back; a hand-typed query string stays as typed until a write.
		...createSearchCodec(),
		// Keep unknown keys.
		search: { strict: false },
		defaultStructuralSharing: true,
		defaultPreload: 'intent',
		defaultPreloadDelay: 50,
		// RTK Query owns freshness.
		defaultPreloadStaleTime: 0,
		defaultPendingComponent: RoutePending,
		defaultPendingMs: 1000,
		defaultPendingMinMs: 500,
		defaultErrorComponent: RouteErrorBoundary,
		defaultNotFoundComponent: NoMatchFeature,
		notFoundMode: 'fuzzy',
		// Nothing restores scroll today; the runs pagination scrolls its own container.
		scrollRestoration: false,
		// React Router left the fragment to the browser; the report page scrolls
		// to its anchors itself.
		defaultHashScrollIntoView: false
	});
}

type AppRouter = ReturnType<typeof createAppRouter>;

declare module '@tanstack/react-router' {
	interface Register {
		router: AppRouter;
	}
}

export { createAppRouter };
export type { AppRouter };
