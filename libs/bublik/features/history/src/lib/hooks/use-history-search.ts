/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useSearch } from '@tanstack/react-router';

import { useRenderedLocation } from '@/router';
import { HistoryAPIQuery } from '@/shared/types';
import { historySearch, type HistoryRouteSearch } from '@/shared/utils';

/**
 * `useSearch` for any route: the registered route tree types it per route
 * (and the selected value for structural sharing), while this reads the
 * search of whichever match it is rendered under.
 */
const useAnySearch = useSearch as unknown as <T>(options: {
	strict: false;
	select: (search: Record<string, unknown>) => T;
}) => T;

type HistorySearchKey = keyof typeof historySearch.shape;

const HISTORY_SEARCH_KEYS = Object.keys(
	historySearch.shape
) as HistorySearchKey[];

/**
 * The history search of the page on screen, read through the shared history
 * schema on `/history` and `/history/v2` alike, before the read-time
 * defaults (`historySearch.withDefaults` fills them).
 *
 * Validated here rather than taken as the route validated it: the sidebar
 * and the header read it from above the page's match, whose search still
 * holds the wire strings, and a codec parses its own typed value unchanged,
 * so on the page itself this is a no-op.
 */
function useHistorySearch<T>(select: (search: HistoryRouteSearch) => T): T {
	return useAnySearch({
		strict: false,
		select: (search) => select(historySearch.validateSearch(search))
	});
}

/** The last of a repeated key, as `Object.fromEntries(searchParams)` read it. */
function lastOf(value: string | string[] | undefined): string | undefined {
	return Array.isArray(value) ? value[value.length - 1] : value;
}

/**
 * The query the history API is asked with, in the wire spelling of each key
 * (`;`-joined lists, `key=` kept as `''`, `true` or `''` for the boxes), as
 * the page used to read it straight off the query string. `project` is the
 * last selected project, as before.
 */
function historySearchToQuery(search: HistoryRouteSearch): HistoryAPIQuery {
	const query: Record<string, string> = {};

	for (const key of HISTORY_SEARCH_KEYS) {
		const codec = historySearch.shape[key] as {
			serialize: (value: unknown) => string | string[] | undefined;
		};
		const value = lastOf(codec.serialize(search[key]));

		if (value !== undefined) query[key] = value;
	}

	const projects = search['project'];
	if (Array.isArray(projects) && projects.length) {
		query['project'] = String(projects[projects.length - 1]);
	}

	return query as HistoryAPIQuery;
}

/**
 * `location.state.fromRun` of the page on screen: a prefilled link from a run
 * opens the search form and waits for the user's search instead of querying.
 */
function useHistoryFromRun(): boolean {
	return useRenderedLocation().state.fromRun === true;
}

export { historySearchToQuery, useHistoryFromRun, useHistorySearch };
