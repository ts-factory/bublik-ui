/* SPDX-License-Identifier: Apache-2.0 */
import { useClassifyResultMutation } from '@/services/bublik-api';
import { useProjectSearch } from '@/bublik/features/projects';
import { toast } from '@/shared/tailwind-ui';
import type { ClassifyNewIssue, ClassifyRequest } from '@/shared/types';

import { ClassifyRequestError, classifyErrorText } from './classify.utils';

export function useClassify(resultId: number, projectIdParam?: number) {
	const { projectIds } = useProjectSearch();
	const projectId = projectIdParam ?? projectIds[0];
	const [classify, mutationState] = useClassifyResultMutation();

	const canClassify = projectId !== undefined;

	async function submit(
		input: Omit<ClassifyRequest, 'resultId' | 'projectId' | 'issue'> & {
			issue: number | ClassifyNewIssue;
		}
	) {
		if (projectId === undefined) {
			toast.error('Select a project first', { position: 'top-center' });

			throw new ClassifyRequestError('Select a project first.');
		}

		// A new issue has to name a project even though the server overrides it
		// with the result's own — see `ClassifyRequest.issue`.
		const issue =
			typeof input.issue === 'number'
				? input.issue
				: { ...input.issue, project: projectId };

		const promise = classify({
			resultId,
			projectId,
			...input,
			issue
		}).unwrap();
		toast.promise(promise, {
			loading: 'Classifying result...',
			success: 'Result classified',
			error: classifyErrorText,
			position: 'top-center'
		});
		return promise;
	}

	return { submit, canClassify, isLoading: mutationState.isLoading };
}
