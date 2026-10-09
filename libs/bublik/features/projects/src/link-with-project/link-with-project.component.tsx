/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	forwardRef,
	useMemo,
	type AnchorHTMLAttributes,
	type ForwardRefExoticComponent,
	type Ref,
	type RefAttributes
} from 'react';
import { Link, type HistoryState } from '@tanstack/react-router';

import { useRenderedLocation, type To } from '@/router';

import { useProjectSearch } from '../hooks';
import { resolveTargetWithSidebarState } from '../lib/sidebar-params.utils';

export interface LinkWithProjectProps
	extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
	/** `pathname?search#hash` or its parts; no pathname stays on the current page. */
	to: To;
	replace?: boolean;
	state?: HistoryState;
	reloadDocument?: boolean;
}

/** Nothing is added to a link for being active, as with React Router's `Link`. */
const NO_PROPS = {};

/** The TanStack `Link` with the route-tree typing of `to` out of the way: a target is any string. */
const AnyLink = Link as unknown as ForwardRefExoticComponent<
	Record<string, unknown> & RefAttributes<HTMLAnchorElement>
>;

/**
 * A router link that carries the sidebar state (`_s`), `hide-sidebar` and
 * the selected projects of the page on screen into its target, unless the
 * target sets them itself. The href is built by the router (basepath
 * included); the window scroll is left alone, as before.
 */
function LinkWithProjectImpl(
	{ to, replace, state, reloadDocument, ...anchorProps }: LinkWithProjectProps,
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
		<AnyLink
			ref={ref}
			{...anchorProps}
			to={target.to}
			search={target.search}
			hash={target.hash}
			state={state}
			replace={replace}
			reloadDocument={reloadDocument}
			resetScroll={false}
			activeProps={NO_PROPS}
			inactiveProps={NO_PROPS}
		/>
	);
}

const LinkWithProject = forwardRef(LinkWithProjectImpl);

export { LinkWithProject };
