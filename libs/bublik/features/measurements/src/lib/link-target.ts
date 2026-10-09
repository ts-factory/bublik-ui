/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	useRouter,
	type AnyRouter,
	type RegisteredRouter,
	type ToOptions
} from '@tanstack/react-router';

import type { To } from '@/router';

/**
 * A typed route target (`to`, `params`, `search` checked against the route
 * tree when the app is type-checked) as the `To` that `LinkWithProject`
 * takes: the pathname and query string the router builds for it, which the
 * link then merges the sidebar state and projects into.
 */
function useLinkTarget<const TTo extends string | undefined>(
	options: ToOptions<RegisteredRouter, string, TTo>
): To {
	const router = useRouter<AnyRouter>();
	const { pathname, searchStr } = router.buildLocation(options as never);

	return { pathname, search: searchStr };
}

export { useLinkTarget };
