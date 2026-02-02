import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import {
	NavigateOptions,
	To,
	useNavigate,
	useSearchParams
} from 'react-router-dom';

import { bublikAPI } from '@/services/bublik-api';
import { SIDEBAR_PREFIX } from '@/bublik/features/sidebar';

import { PROJECT_KEY } from '../constants';

function useProjectSearch() {
	const [searchParams, setSearchParams] = useSearchParams();

	const projectIds = useMemo(() => {
		const values = searchParams.getAll(PROJECT_KEY);

		return values.filter(Boolean).map(Number);
	}, [searchParams]);

	function setProjectIds(projectIds: number[]) {
		const params = new URLSearchParams(searchParams);

		params.delete(PROJECT_KEY);
		projectIds.forEach((id) => params.append(PROJECT_KEY, id.toString()));

		setSearchParams(params);
	}

	return {
		projectIds,
		setProjectsIds: setProjectIds
	};
}

/**
 * Preserves sidebar state params from current URL into target params.
 * Rules:
 * - Preserve all params starting with `sidebar.`
 * - Don't append if the key already exists in target params (allow explicit overrides)
 * - Add project IDs
 */
function mergeParamsWithSidebarState(
	targetParams: URLSearchParams,
	currentSearchParams: URLSearchParams,
	projectIds: number[]
): URLSearchParams {
	const result = new URLSearchParams(targetParams);

	// Preserve sidebar.* params from current URL (if not already in target)
	// Use getAll() to handle params with multiple values (like sidebar.runs.selected)
	const keysToPreserve: string[] = [];
	currentSearchParams.forEach((_, key) => {
		if (key.startsWith(SIDEBAR_PREFIX + '.') && !keysToPreserve.includes(key)) {
			keysToPreserve.push(key);
		}
	});

	keysToPreserve.forEach((key) => {
		if (!result.has(key)) {
			const values = currentSearchParams.getAll(key);
			values.forEach((value) => result.append(key, value));
		}
	});

	// Add/merge project IDs
	result.delete(PROJECT_KEY);
	projectIds.forEach((id) => result.append(PROJECT_KEY, id.toString()));

	return result;
}

function useNavigateWithProject() {
	const { projectIds } = useProjectSearch();
	const [currentSearchParams] = useSearchParams();
	const _navigate = useNavigate();

	const navigate = (to: To, options?: NavigateOptions) => {
		// Build target params from the 'to' object
		const targetSearchStr =
			typeof to === 'string'
				? to.includes('?')
					? to.split('?')[1]
					: ''
				: to.search || '';

		const targetParams = new URLSearchParams(targetSearchStr);

		// Merge with sidebar state and project IDs
		const mergedParams = mergeParamsWithSidebarState(
			targetParams,
			currentSearchParams,
			projectIds
		);

		if (typeof to === 'string') {
			const pathname = to.includes('?') ? to.split('?')[0] : to;
			const mergedSearch = mergedParams.toString();
			const finalTo = mergedSearch ? `${pathname}?${mergedSearch}` : pathname;
			_navigate(finalTo, options);
		} else {
			_navigate(
				{
					pathname: to.pathname,
					search: mergedParams.toString(),
					hash: to.hash
				},
				options
			);
		}
	};

	return navigate;
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
				const result = z
					.object({ data: z.object({ message: z.string() }) })
					.safeParse(error);

				if (result.success) return result.data.data.message;

				return 'Failed to delete project!';
			},
			loading: 'Deleting project...'
		});

		await promise;
	}

	return { deleteProject };
}

export {
	useProjectSearch,
	useDeleteProject,
	useNavigateWithProject,
	useTabTitleWithPrefix
};
