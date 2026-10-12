/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	forwardRef,
	type ForwardRefExoticComponent,
	type Ref,
	type RefAttributes
} from 'react';
import { Link, type LinkComponent } from '@tanstack/react-router';

import { newTabPreload } from '@/router';

import { useSearchWithProject, type SearchOption } from '../hooks';

interface AnyLinkProps extends Record<string, unknown> {
	search?: SearchOption;
}

/** Nothing is added to a link for being active, as with `RouterLink`. */
const NO_PROPS = {};

/** The TanStack `Link` with its route-tree typing out of the way inside the wrapper. */
const AnyLink = Link as unknown as ForwardRefExoticComponent<
	Record<string, unknown> & RefAttributes<HTMLAnchorElement>
>;

function LinkWithProjectImpl(
	{ search, preload, ...props }: AnyLinkProps,
	ref: Ref<HTMLAnchorElement>
) {
	const searchWithProject = useSearchWithProject(search);

	return (
		<AnyLink
			ref={ref}
			{...props}
			search={searchWithProject}
			preload={newTabPreload(props['target'] as string | undefined, preload)}
			// The pages scroll their own containers.
			resetScroll={false}
			activeProps={NO_PROPS}
			inactiveProps={NO_PROPS}
		/>
	);
}

/**
 * The app's internal link: TanStack's `Link`, typed against the route tree
 * (`<LinkWithProject to="/runs/$runId" params={{ runId }} search={{
 * targetIterationId }}>`), that carries the sidebar state (`_s`),
 * `hide-sidebar` and the selected projects of the page on screen into its
 * target: the target's keys first, then `_s` and `hide-sidebar` unless the
 * target sets them, then the projects, which always replace the target's.
 * The window scroll is left alone, no active props are added
 * and a link that opens a new tab never preloads, as with `RouterLink`. A
 * target only known at runtime goes through `RouterLinkWithProject`.
 */
const LinkWithProject = forwardRef(
	LinkWithProjectImpl
) as unknown as LinkComponent<'a'>;

export { LinkWithProject };
