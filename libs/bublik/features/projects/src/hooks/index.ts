import { useMemo } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import {
	NavigateFunction,
	NavigateOptions,
	To,
	useNavigate,
	useSearchParams
} from 'react-router-dom';

import { bublikAPI } from '@/services/bublik-api';

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

function useNavigateWithProject() {
	const { projectIds } = useProjectSearch();
	const _navigate = useNavigate();

	const navigate = (to: To, options?: NavigateOptions) => {
		const params =
			typeof to.search === 'string'
				? new URLSearchParams(to.search)
				: new URLSearchParams();

		projectIds.forEach((id) => params.append(PROJECT_KEY, id.toString()));

		if (typeof to === 'string') {
			_navigate(to, options);
		} else {
			_navigate(
				{ pathname: to.pathname, search: params.toString(), hash: to.hash },
				options
			);
		}
	};

	return navigate;
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

export { useProjectSearch, useDeleteProject, useNavigateWithProject };
