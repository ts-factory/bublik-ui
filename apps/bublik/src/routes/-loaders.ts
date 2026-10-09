/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import type {
	ThunkAction,
	ThunkDispatch,
	UnknownAction
} from '@reduxjs/toolkit';

import { projectIdsOf } from '@/bublik/features/projects';
import { bublikAPI } from '@/services/bublik-api';

/** What the route loaders get from the router (`createAppRouter`'s context). */
interface RouterContext {
	store: { dispatch: ThunkDispatch<unknown, unknown, UnknownAction> };
}

/** An endpoint's `initiate(arg, { subscribe: false })`. */
type Query = ThunkAction<unknown, unknown, unknown, UnknownAction>;

interface LoaderArgs {
	context: RouterContext;
	location: { searchStr: string };
}

/** The args of a loader under `$runId`. */
type RunLoaderArgs = LoaderArgs & { params: { runId: number } };

/**
 * A loader starts the page's first requests, so hovering or
 * focusing a link (`defaultPreload: 'intent'`) has them in the RTK Query
 * cache by the click. `subscribe: false` holds no subscription, so an entry
 * nobody reads expires by `keepUnusedDataFor`. The promise settles with the
 * request and never rejects: a failed request is the page's to show, from
 * its own refetch, not the route's error boundary. The arguments are the
 * page's own, so the page reads the same cache entry.
 */
async function prefetch(
	{ store }: RouterContext,
	...queries: Query[]
): Promise<void> {
	// Each result is a thenable that settles with the request
	await Promise.all(queries.map((query) => store.dispatch(query)));
}

const OPTIONS = { subscribe: false } as const;

/**
 * The run page: its details, its source link, and its table as the page asks
 * for it (the run id as a string, the requirements on the address, `[]` for
 * none), so the page reads the same cache entry.
 */
function loadRun({
	context,
	params,
	deps
}: RunLoaderArgs & {
	deps: { requirements: string[] | undefined };
}): Promise<void> {
	return prefetch(
		context,
		bublikAPI.endpoints.getRunDetails.initiate(params.runId, OPTIONS),
		bublikAPI.endpoints.getRunTableByRunId.initiate(
			{ runId: String(params.runId), requirements: deps.requirements ?? [] },
			OPTIONS
		),
		bublikAPI.endpoints.getRunSource.initiate(params.runId, OPTIONS)
	);
}

/** The run report: the report of the config in the URL, and the run details. */
function loadRunReport({
	context,
	params,
	deps
}: RunLoaderArgs & { deps: { config: number | undefined } }): Promise<void> {
	if (deps.config === undefined) return Promise.resolve();

	return prefetch(
		context,
		bublikAPI.endpoints.getRunReport.initiate(
			{ configId: deps.config, runId: params.runId },
			OPTIONS
		),
		bublikAPI.endpoints.getRunDetails.initiate(params.runId, OPTIONS)
	);
}

/** The log: the run details and the tree. */
function loadLog({ context, params }: RunLoaderArgs): Promise<void> {
	return prefetch(
		context,
		bublikAPI.endpoints.getRunDetails.initiate(params.runId, OPTIONS),
		bublikAPI.endpoints.getTreeByRunId.initiate(params.runId, OPTIONS)
	);
}

/** An issue, in the first selected project as the page asks for it. */
function loadIssue({
	context,
	location,
	params
}: LoaderArgs & { params: { issueId: number } }): Promise<void> {
	const projectId = projectIdsOf(location.searchStr)[0];

	return prefetch(
		context,
		bublikAPI.endpoints.getIssue.initiate(
			{ issueId: params.issueId, projectId },
			OPTIONS
		)
	);
}

/**
 * The dashboard: its default mode. Not its tables: they refetch on mount
 * (`refetchOnMountOrArgChange`, they poll), so a prefetch would only double
 * the request.
 */
function loadDashboard({
	context
}: Pick<LoaderArgs, 'context'>): Promise<void> {
	return prefetch(
		context,
		bublikAPI.endpoints.getDashboardMode.initiate(undefined, OPTIONS)
	);
}

/**
 * The root: the current user and the server features, which the shell reads
 * on every page. Not awaited, so the first page never waits on them.
 */
function loadApp({ context }: Pick<LoaderArgs, 'context'>): void {
	void prefetch(
		context,
		bublikAPI.endpoints.me.initiate(undefined, OPTIONS),
		bublikAPI.endpoints.getServerFeatures.initiate(undefined, OPTIONS)
	);
}

export { loadApp, loadDashboard, loadIssue, loadLog, loadRun, loadRunReport };
export type { RouterContext };
