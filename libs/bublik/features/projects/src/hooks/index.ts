import { useMemo } from 'react';
import { toast } from 'sonner';
import { NumericArrayParam, useQueryParam } from 'use-query-params';
import { z } from 'zod';

import { bublikAPI } from '@/services/bublik-api';

import { PROJECT_KEY } from '../constants';

function useProjectSearch() {
	const [_projectIds, _setProjectsIds] = useQueryParam(
		PROJECT_KEY,
		NumericArrayParam
	);

	const searchProjectIds = useMemo(
		() => ((_projectIds ?? []) as number[]).filter(Boolean),
		[_projectIds]
	);

	function setProjectIds(projectIds: number[]) {
		_setProjectsIds(projectIds);
	}

	return {
		projectIds: searchProjectIds,
		setProjectsIds: setProjectIds
	};
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

export { useProjectSearch, useDeleteProject };
