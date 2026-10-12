/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import {
	useRouter,
	type AnyRouter,
	type HistoryState,
	type UseNavigateResult
} from '@tanstack/react-router';

import {
	currentLocation,
	parseSearch,
	useRenderedLocation,
	type To
} from '@/router';
import { bublikAPI, getErrorMessage } from '@/services/bublik-api';

import { PROJECT_KEY } from '../constants';
import {
	mergeSearchWithSidebarState,
	resolveTargetWithSidebarState
} from '../lib/sidebar-params.utils';

interface NavigateWithProjectOptions {
	replace?: boolean;
	state?: HistoryState;
}

interface ProjectSearch {
	projectIds: number[];
	setProjectsIds: (projectIds: number[]) => void;
}

/**
 * The selected projects of a query string, as every page reads them (route
 * loaders too, so a prefetch lands in the cache entry the page reads).
 */
function projectIdsOf(searchStr: string): number[] {
	return new URLSearchParams(searchStr)
		.getAll(PROJECT_KEY)
		.filter(Boolean)
		.map(Number);
}

/**
 * The selected projects (`?project=1&project=2`) of the page on screen, and
 * a setter that pushes the current page with the new selection (the hash
 * and `location.state` are dropped, as before).
 */
function useProjectSearch(): ProjectSearch {
	const router = useRouter<AnyRouter>();
	const { searchStr } = useRenderedLocation();

	const projectIds = useMemo(() => projectIdsOf(searchStr), [searchStr]);

	function setProjectIds(projectIds: number[]) {
		const params = new URLSearchParams(searchStr);

		params.delete(PROJECT_KEY);
		projectIds.forEach((id) => params.append(PROJECT_KEY, id.toString()));

		void router.navigate({
			to: currentLocation(router).pathname,
			search: parseSearch(params.toString()),
			resetScroll: false
		});
	}

	return {
		projectIds,
		setProjectsIds: setProjectIds
	};
}

/** A typed link's or navigation's `search`, in every form TanStack takes. */
type SearchOption =
	| true
	| Record<string, unknown>
	| ((prev: Record<string, unknown>) => Record<string, unknown>)
	| undefined;

function resolveSearch(
	search: SearchOption,
	prev: Record<string, unknown>
): Record<string, unknown> {
	if (typeof search === 'function') return search(prev);
	if (search === true) return prev;

	return search ?? {};
}

/**
 * A typed target's `search` as the updater `LinkWithProject` and
 * `useNavigateWithProject` hand the router: the target's keys, then the
 * sidebar state, `hide-sidebar` and the projects of the page on screen
 * (`mergeSearchWithSidebarState`).
 */
function useSearchWithProjectOf(): (
	search: SearchOption
) => (prev: Record<string, unknown>) => Record<string, unknown> {
	const { projectIds } = useProjectSearch();
	const { searchStr } = useRenderedLocation();

	return useCallback(
		(search: SearchOption) => (prev: Record<string, unknown>) =>
			mergeSearchWithSidebarState(
				resolveSearch(search, prev),
				new URLSearchParams(searchStr),
				projectIds
			),
		[searchStr, projectIds]
	);
}

/** `useSearchWithProjectOf` for one link's `search`. */
function useSearchWithProject(
	search: SearchOption
): (prev: Record<string, unknown>) => Record<string, unknown> {
	const withProject = useSearchWithProjectOf();

	return useMemo(() => withProject(search), [withProject, search]);
}

/**
 * The router's `navigate`, typed against the route tree, that carries the
 * sidebar state, `hide-sidebar` and the selected projects of the page on
 * screen into the target by `LinkWithProject`'s rule, and leaves the window
 * scroll alone.
 */
function useNavigateWithProject(): UseNavigateResult<string> {
	const router = useRouter<AnyRouter>();
	const withProject = useSearchWithProjectOf();

	return useCallback(
		(options: { search?: SearchOption } & Record<string, unknown>) =>
			router.navigate({
				...options,
				search: withProject(options.search),
				resetScroll: false
			} as Parameters<AnyRouter['navigate']>[0]),
		[router, withProject]
	) as unknown as UseNavigateResult<string>;
}

/**
 * `useNavigateWithProject` for a target assembled at runtime (a stored URL,
 * a query string built by the legacy history codec): the target is a
 * `pathname?search#hash` string or its parts, verbatim; no pathname stays on
 * the current page.
 */
function useRouterNavigateWithProject(): (
	to: To,
	options?: NavigateWithProjectOptions
) => void {
	const router = useRouter<AnyRouter>();
	const { projectIds } = useProjectSearch();
	const { searchStr } = useRenderedLocation();

	return useCallback(
		(to: To, options?: NavigateWithProjectOptions) => {
			const target = resolveTargetWithSidebarState(
				to,
				{ pathname: currentLocation(router).pathname, search: searchStr },
				projectIds
			);

			void router.navigate({
				...target,
				replace: options?.replace,
				state: options?.state,
				// The pages scroll their own containers.
				resetScroll: false
			});
		},
		[router, searchStr, projectIds]
	);
}

function useTabTitleWithPrefix(title: string | (string | undefined)[]) {
	const { projectIds } = useProjectSearch();
	const { data: prefix } = bublikAPI.useGetTabTitlePrefixQuery(
		{ projects: projectIds },
		{ refetchOnMountOrArgChange: true }
	);
	useEffect(() => {
		const titleParts = [
			prefix,
			...(Array.isArray(title) ? title.filter(Boolean) : [title])
		].filter(Boolean);

		document.title = titleParts.join(' - ');
	}, [prefix, title]);
}

interface UseProjectParams {
	id: number | null;
}

function useDeleteProject({ id }: UseProjectParams) {
	const [deleteMutation] = bublikAPI.useDeleteProjectMutation();

	async function deleteProject() {
		if (!id) {
			toast.error("Can't delete default project");
			return;
		}

		const promise = deleteMutation(id).unwrap();

		toast.promise(promise, {
			success: 'Succesfully deleted project!',
			error: (error: unknown) => {
				const { description } = getErrorMessage(error);

				return description || 'Failed to delete project!';
			},
			loading: 'Deleting project...'
		});

		await promise;
	}

	return { deleteProject };
}

export type { NavigateWithProjectOptions, ProjectSearch, SearchOption };
export {
	projectIdsOf,
	useProjectSearch,
	useDeleteProject,
	useNavigateWithProject,
	useRouterNavigateWithProject,
	useSearchWithProject,
	useTabTitleWithPrefix
};
