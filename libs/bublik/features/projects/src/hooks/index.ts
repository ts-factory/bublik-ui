import { toast } from 'sonner';
import { NumericArrayParam, useQueryParam } from 'use-query-params';
import { z } from 'zod';

import { bublikAPI } from '@/services/bublik-api';

function useProjectSearch() {
	const [_projectIds = [], setProjectsIds] = useQueryParam(
		'project',
		NumericArrayParam
	);

	return {
		projectIds: ((_projectIds ?? []) as number[]).filter(Boolean),
		setProjectsIds
	};
}

interface UseProjectParams {
	id: number;
}

function useDeleteProject({ id }: UseProjectParams) {
	const [deleteMutation] = bublikAPI.useDeleteProjectMutation();

	async function deleteProject() {
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
