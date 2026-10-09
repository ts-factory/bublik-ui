/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useCallback } from 'react';
import { useRouter, type AnyRouter } from '@tanstack/react-router';

import { writeSearch, type RoutePath } from '@/router';

interface HistorySearchNavigateOptions {
	/** The route to land on; the current pathname by default. */
	to?: RoutePath;
	replace?: boolean;
}

/**
 * Merges `changes` into the search of the location the router is at right
 * now and navigates there, the hash and `location.state` dropped, as the
 * React Router `setSearchParams`/`navigate` calls of the history page did
 * (pagination pushes, the stacked selection replaces). `useSearchWriter`
 * keeps the state instead, as the `use-query-params` keys did.
 */
function useHistorySearchNavigate(): (
	changes: Record<string, unknown>,
	options?: HistorySearchNavigateOptions
) => void {
	const router = useRouter<AnyRouter>();

	return useCallback(
		(changes, { to, replace = false } = {}) => {
			writeSearch(router, changes, { to, replace, keepState: false });
		},
		[router]
	);
}

export { useHistorySearchNavigate };
