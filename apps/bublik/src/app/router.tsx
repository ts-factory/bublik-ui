/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Matches, RouterContextProvider } from '@tanstack/react-router';

import { LoginDialogContainer } from '@/bublik/features/auth';

import { createAppRouter } from '../router';
import { AnalyticsRouteTracker } from './analytics-route-tracker.component';
import { BublikCommand } from './command-palette';
import { IframeNavigationReporter } from './iframe-navigation-reporter';

/**
 * The one router instance of the app. Created here, at module scope, and
 * not in the factory module: creating a browser history patches
 * `window.history` on the spot, so it must happen once, where the app mounts.
 */
const router = createAppRouter();

/**
 * `RouterProvider` is `RouterContextProvider` + `Matches`. The components
 * every page shares sit between the two rather than on the root route: a
 * route match renders only once its chunk has loaded, and React Router
 * mounted them synchronously with the shell, so a `Mod+K` pressed right
 * after the page loads (the command palette scenario) must already have its
 * listener, and the login dialog must be there for the first rejected
 * request. They only need the router context, not a match.
 */
const Router = () => (
	<RouterContextProvider router={router}>
		<BublikCommand />
		<LoginDialogContainer />
		<AnalyticsRouteTracker />
		<IframeNavigationReporter />
		<Matches />
	</RouterContextProvider>
);

export { Router, router };
