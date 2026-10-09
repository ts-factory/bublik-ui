/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	forwardRef,
	useMemo,
	type CSSProperties,
	type ForwardRefExoticComponent,
	type MouseEventHandler,
	type ReactNode,
	type RefAttributes
} from 'react';
import { Link } from '@tanstack/react-router';

import { resolveTo, useRenderedLocation, type To } from '@/router';

/** The TanStack `Link` with the route-tree typing of `to` out of the way: a target is any string. */
const AnyLink = Link as unknown as ForwardRefExoticComponent<
	Record<string, unknown> & RefAttributes<HTMLAnchorElement>
>;

/** Nothing is added to a link for being active; the navs style it themselves. */
const NO_PROPS = {};

interface SidebarNavRouterLinkProps {
	to: To;
	className?: string;
	style?: CSSProperties;
	children: ReactNode;
	onClick?: MouseEventHandler<HTMLAnchorElement>;
}

/**
 * The link a nav item renders when it is given no `linkComponent`: a router
 * link, so the href carries the basepath (the plain `<a>` it
 * replaces did not). It does not carry the sidebar state or projects; the
 * feature navs pass `LinkWithProject` for that.
 */
const SidebarNavRouterLink = forwardRef<
	HTMLAnchorElement,
	SidebarNavRouterLinkProps
>(function SidebarNavRouterLink({ to, ...props }, ref) {
	const { pathname } = useRenderedLocation();
	const target = useMemo(() => resolveTo(to, pathname), [to, pathname]);

	return (
		<AnyLink
			ref={ref}
			{...props}
			to={target.to}
			search={target.search}
			hash={target.hash}
			resetScroll={false}
			activeProps={NO_PROPS}
			inactiveProps={NO_PROPS}
		/>
	);
});

export { SidebarNavRouterLink };
