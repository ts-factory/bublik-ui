/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	forwardRef,
	type AnchorHTMLAttributes,
	type ForwardRefExoticComponent,
	type RefAttributes
} from 'react';
import { Link, type HistoryState } from '@tanstack/react-router';

import type { Wire } from '../search/wire';

interface RouterLinkProps
	extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
	/** The pathname, basepath-free, used verbatim (no route template is interpolated). */
	to: string;
	/** Wire or typed values; the route middlewares serialize them. */
	search?: Wire | Record<string, unknown>;
	/** The fragment without its `#`; none when absent. */
	hash?: string;
	state?: HistoryState;
	replace?: boolean;
	reloadDocument?: boolean;
	/** The router's default (`'intent'`) unless set; never in a new tab. */
	preload?: 'intent' | false;
}

/**
 * A link that opens a new tab never preloads: the page loads in that tab,
 * so a prefetch here would only fill this tab's cache.
 */
function newTabPreload<Preload>(
	target: string | undefined,
	preload: Preload
): Preload | false {
	return target === '_blank' ? false : preload;
}

/** Nothing is added to a link for being active, as with React Router's `Link`. */
const NO_PROPS = {};

/** The TanStack `Link` with the route-tree typing of `to` out of the way: a target is any string. */
const AnyLink = Link as unknown as ForwardRefExoticComponent<
	Record<string, unknown> & RefAttributes<HTMLAnchorElement>
>;

/**
 * The TanStack `Link` for targets built at runtime: the href is built by the
 * router (basepath included) and a click is a router navigation; modifier
 * clicks and `target="_blank"` are left to the browser. The window scroll is
 * left alone, as React Router left it, and no active class,
 * `data-status` style props are added on top of what the caller passes.
 */
const RouterLink = forwardRef<HTMLAnchorElement, RouterLinkProps>(
	function RouterLink({ to, search, hash, preload, ...props }, ref) {
		return (
			<AnyLink
				ref={ref}
				{...props}
				to={to}
				search={search}
				hash={hash}
				preload={newTabPreload(props.target, preload)}
				resetScroll={false}
				activeProps={NO_PROPS}
				inactiveProps={NO_PROPS}
			/>
		);
	}
);

export { newTabPreload, RouterLink };
export type { RouterLinkProps };
