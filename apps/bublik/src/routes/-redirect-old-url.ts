/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { redirect, type ParsedLocation } from '@tanstack/react-router';

import { convertOldUrlSearch, isOldUrl } from '@/router';

/**
 * `beforeLoad` of `/history`, `/history/v2` and the measurements route: an
 * old jsurl link (a `~` in the query string) is replaced by the same query in
 * the current format, on the same pathname and without the fragment, as
 * `useSearchState` did with `window.location.replace` once the page mounted.
 * The converted bytes are kept as written (the router's codec keeps a query
 * string that parses to the same search). A `~` inside a current value
 * converts to the same string again, so the redirect never loops.
 */
function redirectOldUrl({ location }: { location: ParsedLocation }): void {
	if (!isOldUrl(location.searchStr)) return;

	const searchStr = convertOldUrlSearch(location.searchStr);
	if (searchStr === location.searchStr) return;

	throw redirect({ href: `${location.pathname}${searchStr}`, replace: true });
}

export { redirectOldUrl };
