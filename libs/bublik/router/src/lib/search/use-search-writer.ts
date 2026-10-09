/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useCallback } from 'react';
import { useRouter, type AnyRouter } from '@tanstack/react-router';

import { currentLocation } from '../location/location';

interface WriteSearchOptions {
	/** Replace the history entry (the default), or push one. */
	replace?: boolean;
	/** Merge into the current search (the default), or make `changes` the whole search. */
	merge?: boolean;
	/** Keep the current fragment instead of dropping it, as use-query-params did. */
	keepHash?: boolean;
	/**
	 * Keep `location.state` (the default, as use-query-params did), or drop it,
	 * as React Router's `setSearchParams` did. A write that drops the state
	 * always navigates, as those did, even when the URL would not change.
	 */
	keepState?: boolean;
	/** The pathname to land on (basepath-free, verbatim); the current one by default. */
	to?: string;
}

/**
 * The keys to write, or a function of the search the router is at right
 * now, as the route validated it (typed values; a lib that serves several
 * routes parses through its codecs, which take either form).
 */
type SearchChanges =
	| Record<string, unknown>
	| ((latest: Record<string, unknown>) => object);

/**
 * Writes search keys on the current pathname, the way use-query-params'
 * `replaceIn` did: on the location the router is at right now,
 * so several writes in one handler coalesce into one entry in write order
 * (a functional `changes` receives that location's search, so it composes
 * with the writes before it); `location.state` kept (unless `keepState` is
 * false), the hash dropped (unless `keepHash`), the window scroll left alone,
 * and no navigation when the query string would not change.
 * Values may be typed: the route's search middlewares serialize them, and
 * `undefined` removes a key.
 */
function writeSearch(
	router: AnyRouter,
	changes: SearchChanges,
	{
		replace = true,
		merge = true,
		keepHash = false,
		keepState = true,
		to
	}: WriteSearchOptions = {}
): void {
	const current = currentLocation(router);
	// The router hands this the validated search of `current`: typed values,
	// which the route middlewares serialize back to the same bytes.
	const search = (latest: Record<string, unknown>) => {
		const resolved = typeof changes === 'function' ? changes(latest) : changes;

		return (merge ? { ...latest, ...resolved } : resolved) as Record<
			string,
			unknown
		>;
	};
	const hash = keepHash && current.hash ? current.hash : undefined;
	const target = { to: to ?? current.pathname, search, hash };

	if (keepState) {
		const next = router.buildLocation(target);

		if (
			next.pathname === current.pathname &&
			next.searchStr === current.searchStr
		) {
			return;
		}
	}

	void router.navigate({
		...target,
		replace,
		state: keepState ? true : undefined,
		resetScroll: false
	});
}

/** `writeSearch` bound to the router in context; the callback is stable. */
function useSearchWriter(): (
	changes: SearchChanges,
	options?: WriteSearchOptions
) => void {
	const router = useRouter<AnyRouter>();

	return useCallback(
		(changes, options) => writeSearch(router, changes, options),
		[router]
	);
}

export { useSearchWriter, writeSearch };
export type { SearchChanges, WriteSearchOptions };
