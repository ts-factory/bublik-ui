/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useCallback, useRef } from 'react';
import { useRouter, useSearch, type AnyRouter } from '@tanstack/react-router';

import { currentLocation, writeSearch } from '@/router';
import { RUN_TABLE_SHAPE, type RunRouteSearch } from '@/shared/utils';

/**
 * The run table reads and writes its keys on `/runs/$runId` and
 * `/multiple` alike, through the shape both route files wire
 * (`RUN_TABLE_SHAPE` in `@/shared/utils`).
 */
type RunTableKey = keyof typeof RUN_TABLE_SHAPE;

/** A run table key's typed value. */
type RunTableValue<K extends RunTableKey> = NonNullable<RunRouteSearch[K]>;

/**
 * A write: the value, or an update of the value on the location the router
 * is at right now (its default when absent). `undefined` and `null` remove
 * the key, as use-query-params did.
 */
type RunTableUpdate<T> = T | null | undefined | ((latest: T) => T | null);

/**
 * `useSearch({ strict: false })`, untyped: the table speaks for two routes
 * and reads its keys through the shape's codecs, so the registered route
 * tree's union of search types has nothing to add. The
 * router's `defaultStructuralSharing` keeps a selected value that did not
 * change the same object.
 */
const useMatchSearch = useSearch as unknown as <T>(options: {
	strict: false;
	select: (search: Record<string, unknown>) => T;
}) => T;

/** A run table key of a search, typed or raw (a codec parses both). */
function readRunTableValue<K extends RunTableKey>(
	search: Record<string, unknown>,
	key: K
): RunTableValue<K> | undefined {
	return RUN_TABLE_SHAPE[key].parse(search[key]) as
		| RunTableValue<K>
		| undefined;
}

/**
 * A run table key of the route match on screen, as its codec decodes it;
 * `undefined` when absent or unreadable.
 */
function useRunTableValue<K extends RunTableKey>(
	key: K
): RunTableValue<K> | undefined {
	return useMatchSearch({
		strict: false,
		select: (search) => readRunTableValue(search, key)
	});
}

/**
 * A stable setter of a run table key, writing as use-query-params'
 * `replaceIn` did: merged into the current search, replacing the
 * entry, `location.state` kept and the hash dropped, no navigation when the
 * query string would not change. An update receives the value on the
 * location the router is at right now, or `defaultValue`, so several writes
 * in one handler build on each other and make one history entry.
 */
function useRunTableSetter<K extends RunTableKey>(
	key: K,
	defaultValue?: RunTableValue<K>
): (update: RunTableUpdate<RunTableValue<K>>) => void {
	const router = useRouter<AnyRouter>();
	// The default may be rebuilt every render (the first row of the data); the
	// setter stays stable, as use-query-params' did.
	const defaultRef = useRef(defaultValue);
	defaultRef.current = defaultValue;

	return useCallback(
		(update) => {
			const value =
				typeof update === 'function'
					? update(
							(readRunTableValue(
								currentLocation(router).search as Record<string, unknown>,
								key
							) ?? defaultRef.current) as RunTableValue<K>
					  )
					: update;

			writeSearch(router, { [key]: value ?? undefined });
		},
		[router, key]
	);
}

export { readRunTableValue, useRunTableSetter, useRunTableValue };
export type { RunTableKey, RunTableUpdate, RunTableValue };
