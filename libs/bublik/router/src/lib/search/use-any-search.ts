/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useSearch } from '@tanstack/react-router';

/**
 * `useSearch({ strict: false, select })`, untyped: the search of whichever
 * route match the component renders under, for a lib that serves several
 * routes (or renders above the page's match) and reads its keys through a
 * schema's codecs, so the registered tree's union of search types has
 * nothing to add. A match above the page holds the page's keys as wire
 * strings; codecs parse both forms. The router's
 * `defaultStructuralSharing` keeps a selected value that did not change the
 * same object, so select plain serializable data.
 */
function useAnySearch<T>(select: (search: Record<string, unknown>) => T): T {
	return (
		useSearch as unknown as (options: {
			strict: false;
			select: (search: Record<string, unknown>) => T;
		}) => T
	)({ strict: false, select });
}

export { useAnySearch };
