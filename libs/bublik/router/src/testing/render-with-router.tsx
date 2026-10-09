/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	render,
	renderHook,
	type RenderHookOptions,
	type RenderHookResult,
	type RenderResult
} from '@testing-library/react';
import {
	createMemoryHistory,
	type HistoryState,
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
	RouterProvider,
	type AnyRoute
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
import {
	defineSearch,
	type SearchSchema,
	type Shape
} from '../lib/search/define-search';
import { createSearchCodec } from '../lib/search/wire';

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

/**
 * The app router's options (`apps/bublik/src/router.tsx`) that change a URL or
 * a write, with a search codec of the router's own (it remembers the last parse).
 */
function routerOptions() {
	return {
		basepath: BASEPATH,
		trailingSlash: 'preserve',
		caseSensitive: false,
		search: { strict: false },
		defaultStructuralSharing: true,
		defaultPreload: false,
		scrollRestoration: false,
		defaultHashScrollIntoView: false,
		...createSearchCodec()
	} as const;
}

/**
 * A route of the app's tree for the page to render in, so `getRouteApi(id)`
 * (and `useParams`/`useSearch` with `from: id`) find their match.
 */
interface TestRoute {
	/**
	 * The app's route id, e.g. `/_app/runs/$runId/report`: a `_`-prefixed
	 * segment becomes a pathless layout, a trailing `/` an index route, and
	 * the page renders in the last route.
	 */
	id: string;
	/** The route's own search schema (from `routes/-search`), so typed reads and writes behave as in the app. */
	search?: Pick<SearchSchema<Shape>, 'validateSearch' | 'middlewares'>;
}

interface RenderWithRouterOptions {
	/** The route the page renders in; without it, a splat route matches every path. */
	route?: TestRoute;
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

/** The chain of routes a route id stands for, below `root`, the page in the last one. */
function createRouteChain(root: AnyRoute, { id, search }: TestRoute): AnyRoute {
	const segments = id.split('/').filter(Boolean);
	if (id.endsWith('/')) segments.push('/');

	let top: AnyRoute | undefined;
	let parent = root;

	segments.forEach((segment, index) => {
		const isLeaf = index === segments.length - 1;
		const current = parent;
		const route: AnyRoute = createRoute({
			getParentRoute: () => current,
			...(segment.startsWith('_') ? { id: segment } : { path: segment }),
			...(isLeaf && search
				? {
						validateSearch: search.validateSearch,
						search: { middlewares: search.middlewares }
				  }
				: {}),
			component: isLeaf ? Page : Outlet
		} as never);

		if (parent !== root) parent.addChildren([route]);
		top ??= route;
		parent = route;
	});

	if (!top) throw new Error(`renderWithRouter: empty route id "${id}"`);

	return top;
}

function createTestRouter(
	entry: string,
	state?: HistoryState,
	testRoute?: TestRoute
) {
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
		routeTree: root.addChildren(
			testRoute ? [createRouteChain(root, testRoute), page] : [page]
		),
		history,
		...routerOptions()
	});
}

type TestRouter = ReturnType<typeof createTestRouter>;

/**
 * A router at the options' URL and an RTL wrapper that renders its children
 * as the page of whatever route matched, so `rerender` reaches them.
 */
async function mountRouter({
	route,
	path = '/',
	search = '',
	hash = '',
	state
}: RenderWithRouterOptions) {
	const router = createTestRouter(
		joinTo({ to: path, search, hash }),
		state,
		route
	);
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
): Promise<RenderResult & { router: TestRouter }> {
	const { router, wrapper } = await mountRouter(options);

	return Object.assign(render(ui, { wrapper }), { router });
}

/** Runs `hook` in the page at the options' URL. */
async function renderHookWithRouter<Result, Props>(
	hook: (props: Props) => Result,
	{
		initialProps,
		...options
	}: RenderWithRouterOptions &
		Pick<RenderHookOptions<Props>, 'initialProps'> = {}
): Promise<RenderHookResult<Result, Props> & { router: TestRouter }> {
	const { router, wrapper } = await mountRouter(options);

	return Object.assign(renderHook(hook, { wrapper, initialProps }), { router });
}

export { renderHookWithRouter, renderWithRouter, rootSearch, routerOptions };
export type { RenderWithRouterOptions, TestRoute, TestRouter };
