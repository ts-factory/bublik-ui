/* SPDX-License-Identifier: Apache-2.0 */
import {
	useClassifyResultMutation,
	useGetIssuesQuery
} from '@/services/bublik-api';
import { useProjectSearch } from '@/bublik/features/projects';
import { toast } from '@/shared/tailwind-ui';
import type { ClassifyRequest } from '@/shared/types';

import { ClassifyRequestError, classifyErrorText } from './classify.utils';

export function useClassify(resultId: number, projectIdParam?: number) {
	const { projectIds } = useProjectSearch();
	const projectId = projectIdParam ?? projectIds[0];
	const issues = useGetIssuesQuery(projectId ? { projectId } : {});
	const [classify, mutationState] = useClassifyResultMutation();

	const canClassify = projectId !== undefined;

	async function submit(
		input: Omit<ClassifyRequest, 'resultId' | 'projectId'>
	) {
		if (projectId === undefined) {
			toast.error('Select a project first', { position: 'top-center' });

			throw new ClassifyRequestError('Select a project first.');
		}

		const promise = classify({ resultId, projectId, ...input }).unwrap();
		toast.promise(promise, {
			loading: 'Classifying result...',
			success: 'Result classified',
			error: classifyErrorText,
			position: 'top-center'
		});
		return promise;
	}

	return { issues, submit, canClassify, isLoading: mutationState.isLoading };
}
