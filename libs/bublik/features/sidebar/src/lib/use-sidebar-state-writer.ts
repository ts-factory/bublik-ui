/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useCallback } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

import { updateSidebarStateSearchParams } from './sidebar-url.utils';

type SidebarStateUpdater = Parameters<typeof updateSidebarStateSearchParams>[1];

/**
 * Shared writer for the compressed sidebar-state URL param.
 *
 * Reads the freshest search string from window.location, applies the
 * feature-specific `updater`, and persists the result with `replace: true`
 * while preserving the current `location.state`. Bails out when nothing
 * changed. Returns a stable callback so consumers can safely list it in
 * dependency arrays.
 *
 * Each per-feature sidebar-state hook used to inline this exact scaffold; keep
 * the mechanism here so changes to it happen in one place.
 */
export function useSidebarStateWriter(): (
	updater: SidebarStateUpdater
) => void {
	const [, setSearchParams] = useSearchParams();
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

			setSearchParams(newParams, {
				replace: true,
				state: location.state
			});
		},
		[location.state, setSearchParams]
	);
}
