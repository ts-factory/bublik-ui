/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useCallback, useMemo } from 'react';
import { type AnyRouter, getRouteApi, useRouter } from '@tanstack/react-router';

import { writeSearch } from '@/router';

import type {
	AnalyticsSearch,
	AnalyticsSearchChanges,
	ParsedQueryState
} from './admin-analytics-page.types';
import { parseAnalyticsSearch } from './admin-analytics-page.utils';

const analyticsRoute = getRouteApi('/_app/admin/_admin/analytics');

/** The page's query state, parsed from the route's passthrough keys. */
function useAnalyticsQueryState(): ParsedQueryState {
	const search: AnalyticsSearch = analyticsRoute.useSearch();

	return useMemo(() => parseAnalyticsSearch(search), [search]);
}

/**
 * Writes analytics search keys the way `setSearchParams` did:
 * a push on the search the router holds right now with the changes merged
 * in, the other keys kept, the hash and `location.state` dropped and the
 * window scroll left alone. It goes through the untyped
 * router, as the log hooks do: `apps/bublik-logs` compiles this lib with no
 * registered router, where a functional `search` on a route's `useNavigate`
 * types as `never`.
 */
function useAnalyticsSearchWriter(): (changes: AnalyticsSearchChanges) => void {
	const router = useRouter<AnyRouter>();

	return useCallback(
		(changes) => {
			writeSearch(router, changes, { replace: false, keepState: false });
		},
		[router]
	);
}

export { useAnalyticsQueryState, useAnalyticsSearchWriter };
