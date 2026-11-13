/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import {
	useClassifyResultMutation,
	useLazyGetClassifyOptionsQuery
} from '@/services/bublik-api';
import { useProjectSearch } from '@/bublik/features/projects';
import { toast } from '@/shared/tailwind-ui';
import type {
	ClassifyNewIssue,
	ClassifyRequest,
	ClassifyResponse
} from '@/shared/types';

import {
	matchersFor,
	testCount,
	type ScopePicks
} from '../rule-form/match-scope.utils';

import {
	ClassifyRequestError,
	classifiedToast,
	classifyErrorText,
	resultsInRuns
} from './classify.utils';
import type { RunResults } from './result-selection.utils';

/**
 * Classifies `runs` — one result from its Classify button, or a selection
 * from the bulk bar, of one run or several — under one issue, in one
 * request: all of the results are stamped, or none. They have to be of one
 * project, which the selection sees to.
 */
/** A 400 naming the matchers: the server no longer gives these rules. */
function matchersRefused(error: unknown): boolean {
	if (typeof error !== 'object' || error === null) return false;

	const { status, data } = error as {
		status?: unknown;
		data?: { messages?: unknown } | null;
	};
	const messages = data?.messages;

	return (
		status === 400 &&
		typeof messages === 'object' &&
		messages !== null &&
		'matchers' in messages
	);
}

export function useClassify(runs: RunResults[], projectIdParam?: number) {
	const { projectIds } = useProjectSearch();
	const projectId = projectIdParam ?? projectIds[0];
	const [classify, mutationState] = useClassifyResultMutation();
	const [getOptions] = useLazyGetClassifyOptionsQuery();
	const count = runs.reduce((sum, run) => sum + run.resultIds.length, 0);

	const canClassify = projectId !== undefined && count > 0;

	/**
	 * The matchers come from the rules the options endpoint gives for the
	 * results, each cut down to what the match scope keeps of it.
	 */
	async function submit(
		input: Omit<
			ClassifyRequest,
			'resultIds' | 'projectId' | 'issue' | 'matchers'
		> & {
			issue: number | ClassifyNewIssue;
			picks: ScopePicks;
		}
	): Promise<ClassifyResponse> {
		if (projectId === undefined) {
			toast.error('Select a project first', { position: 'top-center' });

			throw new ClassifyRequestError('Select a project first.');
		}

		if (!count) {
			toast.error('Select a result first', { position: 'top-center' });

			throw new ClassifyRequestError('Select a result first.');
		}

		// The server files a new issue under the results' own project; naming it
		// here only keeps the two in step for the reader.
		const issue =
			typeof input.issue === 'number'
				? input.issue
				: { ...input.issue, project: projectId };

		// One toast, updated in place, so the outcome lands where the eye already is.
		const id = toast.loading(
			count === 1
				? 'Classifying result...'
				: `Classifying ${resultsInRuns(count, runs.length)}...`,
			{ position: 'top-center' }
		);

		const { picks, ...rest } = input;
		const resultIds = runs.flatMap((run) => run.resultIds);

		try {
			// The form showed these; the cache answers unless they went stale.
			const options = await getOptions({ resultIds }, true).unwrap();
			const response = await classify({
				resultIds,
				projectId,
				...rest,
				issue,
				matchers: matchersFor(options, picks)
			}).unwrap();

			const { title, description } = classifiedToast({
				categories: input.categories,
				expected: input.expected ?? null,
				scope: input.scope,
				count,
				runCount: runs.length,
				testCount: testCount(options),
				ruleCount: response.rule_ids.length
			});

			toast.success(title, { id, description });

			return response;
		} catch (error) {
			toast.error(classifyErrorText(error), { id });

			// Refused matchers mean the rules went stale under the form, as after
			// a re-import: fetch them again, so the cards redraw and the next
			// try sends what the server now expects.
			if (matchersRefused(error)) void getOptions({ resultIds }, false);

			throw error;
		}
	}

	return { submit, canClassify, isLoading: mutationState.isLoading };
}
