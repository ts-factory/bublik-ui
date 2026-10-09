/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import {
	useRouter,
	type AnyRouter,
	type HistoryState
} from '@tanstack/react-router';

import {
	currentLocation,
	parseSearch,
	useRenderedLocation,
	type To
} from '@/router';
import { bublikAPI, getErrorMessage } from '@/services/bublik-api';

import { PROJECT_KEY } from '../constants';
import { resolveTargetWithSidebarState } from '../lib/sidebar-params.utils';

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

/**
 * `navigate` that carries the sidebar state, `hide-sidebar` and the selected
 * projects of the page on screen into the target, like `LinkWithProject`.
 */
function useNavigateWithProject(): (
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

export type { NavigateWithProjectOptions, ProjectSearch };
export {
	projectIdsOf,
	useProjectSearch,
	useDeleteProject,
	useNavigateWithProject,
	useTabTitleWithPrefix
};
