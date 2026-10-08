/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute, Outlet } from '@tanstack/react-router';

import { Layout } from '../app/layout';
import { RouteErrorBoundary } from '../app/route-error-boundary';
import { NoMatchFeature } from '../pages/not-found-page';

function AppLayout() {
	return (
		<Layout>
			<Outlet />
		</Layout>
	);
}

// Pathless layout: every page but the auth pages renders inside the app
// shell. A page crash shows the reset UI inside the shell, so the sidebar
// survives it; a `notFound()` thrown by a page renders the not-found page
// inside the shell too (an unknown URL is caught by the `$` splat route).
export const Route = createFileRoute('/_app')({
	component: AppLayout,
	errorComponent: RouteErrorBoundary,
	notFoundComponent: NoMatchFeature
});
