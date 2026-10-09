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
}

/**
 * Writes search keys on the current pathname, the way use-query-params'
 * `replaceIn` did: on the location the router is at right now,
 * so several writes in one handler coalesce into one entry in write order;
 * `location.state` kept, the hash dropped (unless `keepHash`), the window scroll left alone,
 * and no navigation when the query string would not change.
 * Values may be typed: the route's search middlewares serialize them, and
 * `undefined` removes a key.
 */
function writeSearch(
	router: AnyRouter,
	changes: Record<string, unknown>,
	{ replace = true, merge = true, keepHash = false }: WriteSearchOptions = {}
): void {
	const current = currentLocation(router);
	const search = merge ? { ...current.search, ...changes } : changes;
	const hash = keepHash && current.hash ? current.hash : undefined;
	const target = { to: current.pathname, search, hash };

	if (router.buildLocation(target).searchStr === current.searchStr) return;

	void router.navigate({ ...target, replace, state: true, resetScroll: false });
}

/** `writeSearch` bound to the router in context; the callback is stable. */
function useSearchWriter(): (
	changes: Record<string, unknown>,
	options?: WriteSearchOptions
) => void {
	const router = useRouter<AnyRouter>();

	return useCallback(
		(changes, options) => writeSearch(router, changes, options),
		[router]
	);
}

export { useSearchWriter, writeSearch };
export type { WriteSearchOptions };
