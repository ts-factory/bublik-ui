/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/**
 * `@/router/testing`: render a component or a hook under a memory router
 * shaped like the app's, and assert on `router.history.location`. For specs
 * only; never imported by app code.
 */
export {
	renderHookWithRouter,
	renderWithRouter,
	rootSearch,
	routerOptions
} from './render-with-router';
export type {
	RenderWithRouterOptions,
	TestRoute,
	TestRouter
} from './render-with-router';
