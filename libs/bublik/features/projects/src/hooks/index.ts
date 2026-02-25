import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import {
	createPath,
	NavigateOptions,
	parsePath,
	To,
	useNavigate,
	useSearchParams
} from 'react-router-dom';

import { bublikAPI, getErrorMessage } from '@/services/bublik-api';

import { HIDE_SIDEBAR_QUERY_KEY, PROJECT_KEY } from '../constants';

function toStringWithSearchParams(to: string, params: URLSearchParams): string {
	const parsedTo = parsePath(to);
	const search = params.toString();

	return createPath({
		pathname: parsedTo.pathname,
		search: search ? `?${search}` : '',
		hash: parsedTo.hash
	});
}

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

function useNavigateWithProject() {
	const { projectIds } = useProjectSearch();
	const _navigate = useNavigate();
	const [currentSearchParams] = useSearchParams();

	const navigate = (to: To, options?: NavigateOptions) => {
		const params =
			typeof to === 'string'
				? new URLSearchParams(parsePath(to).search ?? '')
				: typeof to.search === 'string'
				? new URLSearchParams(to.search)
				: new URLSearchParams();
		const hideSidebar = currentSearchParams.get(HIDE_SIDEBAR_QUERY_KEY);

		params.delete(PROJECT_KEY);
		projectIds.forEach((id) => params.append(PROJECT_KEY, id.toString()));

		if (!params.has(HIDE_SIDEBAR_QUERY_KEY) && hideSidebar) {
			params.set(HIDE_SIDEBAR_QUERY_KEY, hideSidebar);
		}

		if (typeof to === 'string') {
			_navigate(toStringWithSearchParams(to, params), options);
		} else {
			const search = params.toString();

			_navigate(
				{
					pathname: to.pathname,
					search: search ? `?${search}` : '',
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
				const { description } = getErrorMessage(error);

				return description || 'Failed to delete project!';
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
