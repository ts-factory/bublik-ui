/* SPDX-License-Identifier: Apache-2.0 */
import {
	useClassifyResultMutation,
	useLazyGetClassifyOptionsQuery
} from '@/services/bublik-api';
import { useProjectSearch } from '@/bublik/features/projects';
import { toast } from '@/shared/tailwind-ui';
import type { ClassifyNewIssue, ClassifyRequest } from '@/shared/types';

import {
	matcherForTest,
	type ScopePicks
} from '../rule-form/match-scope.utils';

import {
	ClassifyRequestError,
	classifiedToast,
	classifyErrorText
} from './classify.utils';

/**
 * Classifies `resultIds` — one result from its Classify button, or a
 * selection of them from the bulk bar — in one request. They have to be of
 * one run; the selection sees to that before they get here.
 */
export function useClassify(resultIds: number[], projectIdParam?: number) {
	const { projectIds } = useProjectSearch();
	const projectId = projectIdParam ?? projectIds[0];
	const [classify, mutationState] = useClassifyResultMutation();
	const [getOptions] = useLazyGetClassifyOptionsQuery();

	const canClassify = projectId !== undefined && resultIds.length > 0;

	/**
	 * One request, a rule per test and category. The matchers come from what
	 * the options endpoint says each test's results share, cut down to what
	 * the match scope keeps.
	 */
	async function submit(
		input: Omit<
			ClassifyRequest,
			'resultIds' | 'projectId' | 'issue' | 'matchers'
		> & {
			issue: number | ClassifyNewIssue;
			picks: ScopePicks;
		}
	) {
		if (projectId === undefined) {
			toast.error('Select a project first', { position: 'top-center' });

			throw new ClassifyRequestError('Select a project first.');
		}

		if (!resultIds.length) {
			toast.error('Select a result first', { position: 'top-center' });

			throw new ClassifyRequestError('Select a result first.');
		}

		// The server files a new issue under the result's own project; naming it
		// here only keeps the two in step for the reader.
		const issue =
			typeof input.issue === 'number'
				? input.issue
				: { ...input.issue, project: projectId };

		// One toast, updated in place, so the outcome lands where the eye already is.
		const id = toast.loading(
			resultIds.length === 1
				? 'Classifying result...'
				: `Classifying ${resultIds.length} results...`,
			{ position: 'top-center' }
		);

		try {
			const { picks, ...rest } = input;
			const options = await getOptions({ resultIds }).unwrap();
			const result = await classify({
				resultIds,
				projectId,
				...rest,
				issue,
				matchers: options.tests.map((test) =>
					matcherForTest(test, options, picks)
				)
			}).unwrap();
			const { title, description } = classifiedToast({
				categories: input.categories,
				expected: input.expected ?? null,
				scope: input.scope,
				count: resultIds.length,
				testCount: options.tests.length
			});

			toast.success(title, { id, description });

			return result;
		} catch (error) {
			toast.error(classifyErrorText(error), { id });

			throw error;
		}
	}

	return { submit, canClassify, isLoading: mutationState.isLoading };
}
