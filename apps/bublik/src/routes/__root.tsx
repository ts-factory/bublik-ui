/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { lazy, Suspense } from 'react';
import { createRootRoute, Outlet } from '@tanstack/react-router';

import { RouteErrorBoundary } from '../app/route-error-boundary';
import { NoMatchFeature } from '../pages/not-found-page';
import { rootSearch } from './-search/root.search';

// Dev only, and not under browser automation: its toggle sits over the
// bottom-right corner, where the tables' pagination is.
const RouterDevtools =
	import.meta.env.DEV && !navigator.webdriver
		? lazy(() =>
				import('@tanstack/react-router-devtools').then((module) => ({
					default: module.TanStackRouterDevtools
				}))
		  )
		: () => null;

// The components every page shares (command palette, login dialog, analytics
// tracker, iframe reporter) render above the matches, in `app/router.tsx`:
// a match renders only once its chunk has loaded, and they must be there
// from the first render as they were under React Router.
function RootComponent() {
	return (
		<>
			<Outlet />
			<Suspense>
				<RouterDevtools position="bottom-right" />
			</Suspense>
		</>
	);
}

export const Route = createRootRoute({
	validateSearch: rootSearch.validateSearch,
	search: { middlewares: rootSearch.middlewares },
	component: RootComponent,
	// A crash above the app shell: the full-page reset UI with the real error.
	errorComponent: RouteErrorBoundary,
	// Only a `notFound()` thrown outside the app shell (the auth pages) lands
	// here; unknown URLs are caught by the `_app/$` splat inside the shell.
	notFoundComponent: NoMatchFeature
});
