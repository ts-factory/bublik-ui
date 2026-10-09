/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useCallback } from 'react';
import { useRouter, type AnyRouter } from '@tanstack/react-router';

import { currentLocation, parseSearch, writeSearch } from '@/router';

import { updateSidebarStateSearchParams } from './sidebar-url.utils';

type SidebarStateUpdater = Parameters<typeof updateSidebarStateSearchParams>[1];

/**
 * Shared writer for the compressed sidebar-state URL param.
 *
 * Reads the freshest location the router holds (several sections write in
 * the same tick, `window.location` only catches up a microtask later, and the
 * next page may still be loading), applies the feature-specific `updater`,
 * and persists the result with `replace: true`
 * while preserving the current `location.state` and `location.hash`. Bails out
 * when nothing changed. Returns a stable callback so consumers can safely list
 * it in dependency arrays.
 *
 * The pathname, search, hash and state all come from that one location: a
 * write that dropped the fragment lost a shared link's `#fragment` on
 * arrival (every section writes `_s` on mount), and an explicit pathname
 * keeps a trailing slash that `to: '.'` would drop. Not the functional
 * `search` updater either: the bail-out needs the result before navigating.
 *
 * Each per-feature sidebar-state hook used to inline this exact scaffold; keep
 * the mechanism here so changes to it happen in one place.
 */
export function useSidebarStateWriter(): (
	updater: SidebarStateUpdater
) => void {
	const router = useRouter<AnyRouter>();

	return useCallback(
		(updater: SidebarStateUpdater) => {
			// One location for every part of the target: see `useLatestLocation`.
			const latest = currentLocation(router);
			const newParams = updateSidebarStateSearchParams(
				new URLSearchParams(latest.searchStr),
				updater
			);

			if (!newParams) {
				return;
			}

			// A replace on the same location, its hash and state kept
			writeSearch(router, parseSearch(newParams.toString()), {
				merge: false,
				keepHash: true
			});
		},
		[router]
	);
}
