import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import {
	createPath,
	NavigateOptions,
	parsePath,
	To,
	useLocation,
	useNavigate,
	useSearchParams
} from 'react-router-dom';

import { bublikAPI, getErrorMessage } from '@/services/bublik-api';

import { PROJECT_KEY } from '../constants';
import { mergeParamsWithSidebarState } from '../lib/sidebar-params.utils';

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
	const location = useLocation();

	const navigate = (to: To, options?: NavigateOptions) => {
		const parsedTo = typeof to === 'string' ? parsePath(to) : to;
		const targetParams = new URLSearchParams(parsedTo.search ?? '');
		const freshSearchParams = new URLSearchParams(location.search);
		const mergedParams = mergeParamsWithSidebarState(
			targetParams,
			freshSearchParams,
			projectIds
		);
		const search = mergedParams.toString();

		if (typeof to === 'string') {
			_navigate(
				createPath({
					pathname: parsedTo.pathname,
					search: search ? `?${search}` : '',
					hash: parsedTo.hash
				}),
				options
			);
		} else {
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
