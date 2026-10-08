/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { lazy, Suspense } from 'react';
import { createRootRoute, Outlet } from '@tanstack/react-router';

const RouterDevtools = import.meta.env.DEV
	? lazy(() =>
			import('@tanstack/react-router-devtools').then((module) => ({
				default: module.TanStackRouterDevtools
			}))
	  )
	: () => null;

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

// The command palette, login dialog, analytics tracker and iframe reporter
// move here from the React Router tree with the shell switch (#62).
export const Route = createRootRoute({
	component: RootComponent
});
