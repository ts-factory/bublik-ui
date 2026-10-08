/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useCallback } from 'react';
import { useLatestLocation, useNavigate } from '@/router';

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
 * `navigate` rather than `setSearchParams`: the latter writes a location with
 * only a `search`, which silently drops the fragment. Every section writes `_s`
 * on mount, so a shared link carrying a `#fragment` lost it on arrival.
 *
 * Each per-feature sidebar-state hook used to inline this exact scaffold; keep
 * the mechanism here so changes to it happen in one place.
 */
export function useSidebarStateWriter(): (
	updater: SidebarStateUpdater
) => void {
	const navigate = useNavigate();
	const getLatestLocation = useLatestLocation();

	return useCallback(
		(updater: SidebarStateUpdater) => {
			// One location for every part of the target: see `useLatestLocation`.
			const latest = getLatestLocation();
			const newParams = updateSidebarStateSearchParams(
				new URLSearchParams(latest.search),
				updater
			);

			if (!newParams) {
				return;
			}

			const search = newParams.toString();

			navigate(
				{
					pathname: latest.pathname,
					search: search ? `?${search}` : '',
					hash: latest.hash
				},
				{ replace: true, state: latest.state }
			);
		},
		[getLatestLocation, navigate]
	);
}
