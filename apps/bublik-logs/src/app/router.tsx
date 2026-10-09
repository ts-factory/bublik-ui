/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	createRootRoute,
	createRoute,
	createRouter,
	type RouterHistory
} from '@tanstack/react-router';

import { createSearchCodec, defineSearch, str } from '@/router';

import { LogViewer } from './log-viewer';

/**
 * Both keys stay raw strings, as `searchParams.get` returned them: a bundle's
 * node ids are file names under `/json/`, not numbers, and `page` keeps its
 * wire bytes (`0` is "all pages"; the page converts it). Like the main app's
 * log schema, a repeated key is read and rewritten as its first value. Every
 * other key (`lineNumber`, `mode`, …) passes through untouched.
 */
const logViewerSearch = defineSearch({ focusId: str(), page: str() });

const rootRoute = createRootRoute();

const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/',
	validateSearch: logViewerSearch.validateSearch,
	search: { middlewares: logViewerSearch.middlewares },
	component: LogViewer
});

const routeTree = rootRoute.addChildren([indexRoute]);

/**
 * The log viewer's own router: the app's raw codec and no
 * basepath, the bundle is served from its root. A factory for the same
 * reason as the main app's: a browser history patches `window.history` when
 * it is created, so `main.tsx` creates it once and the spec passes a memory
 * history.
 */
function createLogViewerRouter(history?: RouterHistory) {
	return createRouter({
		routeTree,
		history,
		// The app's raw codec, keeping a hand-typed query string as typed.
		...createSearchCodec(),
		trailingSlash: 'preserve',
		// React Router rendered nothing for a path other than `/`.
		defaultNotFoundComponent: () => null,
		scrollRestoration: false,
		defaultHashScrollIntoView: false
	});
}

type LogViewerRouter = ReturnType<typeof createLogViewerRouter>;

declare module '@tanstack/react-router' {
	interface Register {
		router: LogViewerRouter;
	}
}

export { createLogViewerRouter };
export type { LogViewerRouter };
