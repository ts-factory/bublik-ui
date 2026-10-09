/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
	type HistoryState
} from '@tanstack/react-router';
import type { ReactElement } from 'react';

import { defineSearch, enumOf, num, repeatedNum } from '@/router';
import { rootSearch, routerOptions } from '@/router/testing';

const BASEPATH = '/v2';

/**
 * The app's route schemas this lib links to or renders in
 * (`apps/bublik/src/routes/-search/*.search.ts`), which a lib cannot import:
 * only the keys the measurements page reads or writes.
 */
const measurementsSearch = defineSearch({
	mode: enumOf(['default', 'charts', 'tables', 'split', 'overlay']),
	selectedCharts: repeatedNum()
});
const logSearch = defineSearch({
	focusId: num(),
	mode: enumOf(['log', 'infoAndlog', 'treeAndinfoAndlog', 'treeAndlog'])
});
const runSearch = defineSearch({ targetIterationId: num() });

/** The page route for `renderWithRouter`'s `route` option. */
const MEASUREMENTS_ROUTE = {
	id: '/_app/runs/$runId/results/$resultId/measurements',
	search: measurementsSearch
};

interface MeasurementsRouterOptions {
	/** The URL, basepath-free, with its search and hash. */
	url: string;
	/** `location.state` of the entry. */
	state?: HistoryState;
	/** Rendered inside the measurements route's match. */
	page?: ReactElement | null;
	/** Rendered in the `_app` layout, outside every page match, as the app's sidebar is. */
	layout?: ReactElement | null;
}

/**
 * A memory router shaped like the app's around the measurements page: the
 * root schema, the pathless `_app` layout and the page route under the same
 * route id, so `getRouteApi` finds its match, plus the log and run routes
 * the page links to and a splat for any other page.
 */
function createMeasurementsRouter({
	url,
	state,
	page = null,
	layout = null
}: MeasurementsRouterOptions) {
	const history = createMemoryHistory({
		initialEntries: [`${BASEPATH}${url}`]
	});
	if (state) history.replace(`${BASEPATH}${url}`, state);

	const root = createRootRoute({
		validateSearch: rootSearch.validateSearch,
		search: { middlewares: rootSearch.middlewares },
		component: Outlet
	});
	const app = createRoute({
		getParentRoute: () => root,
		id: '_app',
		component: () => (
			<>
				{layout}
				<Outlet />
			</>
		)
	});
	const measurements = createRoute({
		getParentRoute: () => app,
		path: 'runs/$runId/results/$resultId/measurements',
		validateSearch: measurementsSearch.validateSearch,
		search: { middlewares: measurementsSearch.middlewares },
		component: () => page
	});
	const log = createRoute({
		getParentRoute: () => app,
		path: 'log/$runId',
		validateSearch: logSearch.validateSearch,
		search: { middlewares: logSearch.middlewares }
	});
	const run = createRoute({
		getParentRoute: () => app,
		path: 'runs/$runId',
		validateSearch: runSearch.validateSearch,
		search: { middlewares: runSearch.middlewares }
	});
	const other = createRoute({ getParentRoute: () => app, path: '$' });

	return createRouter({
		routeTree: root.addChildren([
			app.addChildren([measurements, log, run, other])
		]),
		history,
		...routerOptions()
	});
}

export { BASEPATH, createMeasurementsRouter, MEASUREMENTS_ROUTE };
export type { MeasurementsRouterOptions };
