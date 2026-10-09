/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	render,
	renderHook,
	type RenderHookOptions
} from '@testing-library/react';
import {
	createMemoryHistory,
	type HistoryState,
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
	RouterProvider
} from '@tanstack/react-router';
import {
	createContext,
	useContext,
	type ReactElement,
	type ReactNode
} from 'react';

import { joinTo } from '../lib/path/to';
import {
	bool01,
	enumOf,
	passthrough,
	repeatedNum,
	str
} from '../lib/search/codecs';
import { defineSearch } from '../lib/search/define-search';
import { parseSearch, stringifySearch } from '../lib/search/wire';

const BASEPATH = '/v2';

/**
 * The app's root search schema (`apps/bublik/src/routes/-search/root.search.ts`),
 * which a lib cannot import: typed writes of these keys serialize as in the app.
 */
const rootSearch = defineSearch(
	{
		project: repeatedNum(),
		_s: str(),
		'hide-sidebar': passthrough(),
		'settings-open': bool01(),
		'settings-tab': enumOf(['account', 'appearance', 'beta', 'preferences'])
	},
	{ 'settings-open': false, 'settings-tab': 'account' }
);

/** The app router's options (`apps/bublik/src/router.tsx`) that change a URL or a write. */
const routerOptions = {
	basepath: BASEPATH,
	trailingSlash: 'preserve',
	caseSensitive: false,
	parseSearch,
	stringifySearch,
	search: { strict: false },
	defaultStructuralSharing: true,
	defaultPreload: false,
	scrollRestoration: false,
	defaultHashScrollIntoView: false
} as const;

interface RenderWithRouterOptions {
	/** The pathname, basepath-free. */
	path?: string;
	/** The query string, with or without its `?`. */
	search?: string;
	/** The fragment, with or without its `#`. */
	hash?: string;
	/** `location.state` of the entry. */
	state?: HistoryState;
}

/**
 * What the page renders. A context rather than the route's component: the
 * router memoizes its matches, so only a context change reaches the page on
 * `rerender`.
 */
const PageContext = createContext<ReactNode>(null);

function Page() {
	return <>{useContext(PageContext)}</>;
}

function createTestRouter(entry: string, state?: HistoryState) {
	const history = createMemoryHistory({
		initialEntries: [`${BASEPATH}${entry}`]
	});
	// Memory entries are plain strings; the state goes on with a replace.
	if (state) history.replace(`${BASEPATH}${entry}`, state);

	const root = createRootRoute({
		validateSearch: rootSearch.validateSearch,
		search: { middlewares: rootSearch.middlewares },
		component: Outlet
	});
	const page = createRoute({
		getParentRoute: () => root,
		path: '$',
		component: Page
	});

	return createRouter({
		routeTree: root.addChildren([page]),
		history,
		...routerOptions
	});
}

type TestRouter = ReturnType<typeof createTestRouter>;

/**
 * A router at the options' URL and an RTL wrapper that renders its children
 * as the page of whatever route matched, so `rerender` reaches them.
 */
async function setup({
	path = '/',
	search = '',
	hash = '',
	state
}: RenderWithRouterOptions) {
	const router = createTestRouter(joinTo({ to: path, search, hash }), state);
	await router.load();

	function Wrapper({ children }: { children: ReactNode }) {
		return (
			<PageContext.Provider value={children}>
				<RouterProvider router={router} />
			</PageContext.Provider>
		);
	}

	return { router, wrapper: Wrapper };
}

/** Renders `ui` as the page at the options' URL. */
async function renderWithRouter(
	ui: ReactElement,
	options: RenderWithRouterOptions = {}
) {
	const { router, wrapper } = await setup(options);

	return { router, ...render(ui, { wrapper }) };
}

/** Runs `hook` in the page at the options' URL. */
async function renderHookWithRouter<Result, Props>(
	hook: (props: Props) => Result,
	{
		initialProps,
		...options
	}: RenderWithRouterOptions &
		Pick<RenderHookOptions<Props>, 'initialProps'> = {}
) {
	const { router, wrapper } = await setup(options);

	return { router, ...renderHook(hook, { wrapper, initialProps }) };
}

export { renderHookWithRouter, renderWithRouter, rootSearch, routerOptions };
export type { RenderWithRouterOptions, TestRouter };
