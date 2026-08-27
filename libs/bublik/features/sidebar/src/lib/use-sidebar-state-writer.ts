/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { updateSidebarStateSearchParams } from './sidebar-url.utils';

type SidebarStateUpdater = Parameters<typeof updateSidebarStateSearchParams>[1];

/**
 * Shared writer for the compressed sidebar-state URL param.
 *
 * Reads the freshest search string from window.location, applies the
 * feature-specific `updater`, and persists the result with `replace: true`
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
	const location = useLocation();

	return useCallback(
		(updater: SidebarStateUpdater) => {
			const currentSearchParams = new URLSearchParams(window.location.search);
			const newParams = updateSidebarStateSearchParams(
				currentSearchParams,
				updater
			);

			if (!newParams) {
				return;
			}

			const search = newParams.toString();

			navigate(
				{
					pathname: location.pathname,
					search: search ? `?${search}` : '',
					hash: location.hash
				},
				{ replace: true, state: location.state }
			);
		},
		[location.pathname, location.hash, location.state, navigate]
	);
}
