/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	forwardRef,
	useCallback,
	type ForwardRefExoticComponent,
	type Ref,
	type RefAttributes
} from 'react';
import { Link, type LinkComponent } from '@tanstack/react-router';

import { newTabPreload, useRenderedLocation } from '@/router';

import { useProjectSearch } from '../hooks';
import { mergeSearchWithSidebarState } from '../lib/sidebar-params.utils';

type SearchOption =
	| true
	| Record<string, unknown>
	| ((prev: Record<string, unknown>) => Record<string, unknown>)
	| undefined;

interface AnyLinkProps extends Record<string, unknown> {
	search?: SearchOption;
}

/** Nothing is added to a link for being active, as with `RouterLink`. */
const NO_PROPS = {};

/** The TanStack `Link` with its route-tree typing out of the way inside the wrapper. */
const AnyLink = Link as unknown as ForwardRefExoticComponent<
	Record<string, unknown> & RefAttributes<HTMLAnchorElement>
>;

function resolveSearch(
	search: SearchOption,
	prev: Record<string, unknown>
): Record<string, unknown> {
	if (typeof search === 'function') return search(prev);
	if (search === true) return prev;

	return search ?? {};
}

function TypedLinkWithProjectImpl(
	{ search, preload, ...props }: AnyLinkProps,
	ref: Ref<HTMLAnchorElement>
) {
	const { projectIds } = useProjectSearch();
	const { searchStr } = useRenderedLocation();

	const searchWithProject = useCallback(
		(prev: Record<string, unknown>) =>
			mergeSearchWithSidebarState(
				resolveSearch(search, prev),
				new URLSearchParams(searchStr),
				projectIds
			),
		[search, searchStr, projectIds]
	);

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
 * `LinkWithProject` for a typed target: `to`, `params` and `search` are
 * checked against the route tree (`<TypedLinkWithProject to="/runs/$runId"
 * params={{ runId }} search={{ targetIterationId }}>`), and the link carries
 * the sidebar state (`_s`), `hide-sidebar` and the selected projects of the
 * page on screen into its target by the same rule, so the href is the one
 * `LinkWithProject` builds for the same URL. The window scroll is left alone
 * and no active props are added, as with `RouterLink`.
 */
const TypedLinkWithProject = forwardRef(
	TypedLinkWithProjectImpl
) as unknown as LinkComponent<'a'>;

export { TypedLinkWithProject };
