/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { forwardRef, useMemo, type Ref } from 'react';

import {
	RouterLink,
	useRenderedLocation,
	type RouterLinkProps,
	type To
} from '@/router';

import { useProjectSearch } from '../hooks';
import { resolveTargetWithSidebarState } from '../lib/sidebar-params.utils';

export interface RouterLinkWithProjectProps
	extends Omit<RouterLinkProps, 'to' | 'search' | 'hash'> {
	/** `pathname?search#hash` or its parts; no pathname stays on the current page. */
	to: To;
}

/**
 * `LinkWithProject` for a target assembled at runtime (a stored URL, a path
 * the API returns, a query string built by the legacy history codec, a
 * same-page hash): a `RouterLink` that carries the sidebar state (`_s`),
 * `hide-sidebar` and the selected projects of the page on screen into its
 * target, unless the target sets them itself. A route known when the code
 * is written is a typed `LinkWithProject`.
 */
function RouterLinkWithProjectImpl(
	{ to, ...props }: RouterLinkWithProjectProps,
	ref: Ref<HTMLAnchorElement>
) {
	const { projectIds } = useProjectSearch();
	const { pathname, searchStr } = useRenderedLocation();

	const target = useMemo(
		() =>
			resolveTargetWithSidebarState(
				to,
				{ pathname, search: searchStr },
				projectIds
			),
		[to, pathname, searchStr, projectIds]
	);

	return (
		<RouterLink
			ref={ref}
			{...props}
			to={target.to}
			search={target.search}
			hash={target.hash}
		/>
	);
}

const RouterLinkWithProject = forwardRef(RouterLinkWithProjectImpl);

export { RouterLinkWithProject };
