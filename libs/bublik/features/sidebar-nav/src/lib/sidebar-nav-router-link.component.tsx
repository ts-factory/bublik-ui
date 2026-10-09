/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	forwardRef,
	useMemo,
	type CSSProperties,
	type MouseEventHandler,
	type ReactNode
} from 'react';

import { resolveTo, RouterLink, useRenderedLocation, type To } from '@/router';

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
		<RouterLink
			ref={ref}
			{...props}
			to={target.to}
			search={target.search}
			hash={target.hash}
		/>
	);
});

export { SidebarNavRouterLink };
