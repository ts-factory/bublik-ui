/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import {
	useClassifyResultMutation,
	useLazyGetClassifyOptionsByRunQuery
} from '@/services/bublik-api';
import { useProjectSearch } from '@/bublik/features/projects';
import { toast } from '@/shared/tailwind-ui';
import type { ClassifyNewIssue, ClassifyRequest } from '@/shared/types';

import {
	matchersForRun,
	mergeClassifyOptions,
	type ScopePicks
} from '../rule-form/match-scope.utils';

import {
	ClassifyRequestError,
	classifiedToast,
	classifyErrorText,
	resultsInRuns
} from './classify.utils';
import {
	classifyInTurn,
	notClassifiedText,
	type ClassifyInTurnOutcome
} from './classify-runs.utils';
import type { RunResults } from './result-selection.utils';

/**
 * Classifies `runs` — one result from its Classify button, or a selection
 * from the bulk bar, grouped by run — under one issue. The server takes the
 * results of one run per request, so each run gets its own, one after
 * another; they have to be of one project, which the selection sees to.
 */
export function useClassify(runs: RunResults[], projectIdParam?: number) {
	const { projectIds } = useProjectSearch();
	const projectId = projectIdParam ?? projectIds[0];
	const [classify, mutationState] = useClassifyResultMutation();
	const [getOptions] = useLazyGetClassifyOptionsByRunQuery();
	const count = runs.reduce((sum, run) => sum + run.resultIds.length, 0);

	const canClassify = projectId !== undefined && count > 0;

	/**
	 * A request per run, a rule per test and category. The matchers come from
	 * what the options endpoint says each test's results share in every run,
	 * cut down to what the match scope keeps. When some runs fail, the others
	 * stay classified and the toast names the ones that did not.
	 */
	async function submit(
		input: Omit<
			ClassifyRequest,
			'resultIds' | 'projectId' | 'issue' | 'matchers'
		> & {
			issue: number | ClassifyNewIssue;
			picks: ScopePicks;
		}
	): Promise<ClassifyInTurnOutcome> {
		if (projectId === undefined) {
			toast.error('Select a project first', { position: 'top-center' });

			throw new ClassifyRequestError('Select a project first.');
		}

		if (!count) {
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
			count === 1
				? 'Classifying result...'
				: `Classifying ${resultsInRuns(count, runs.length)}...`,
			{ position: 'top-center' }
		);

		const { picks, ...rest } = input;
		let outcome: ClassifyInTurnOutcome;
		let testCount: number;

		try {
			// Every run's options before anything is sent: what is kept has to be
			// valid for each of them, and a run that cannot say leaves the whole
			// selection unwritten.
			const perRun = await getOptions({
				runs: runs.map((run) => run.resultIds)
			}).unwrap();
			const merged = mergeClassifyOptions(perRun);

			testCount = merged.tests.length;
			outcome = await classifyInTurn(runs, issue, (run, runIssue) =>
				classify({
					resultIds: run.resultIds,
					projectId,
					...rest,
					issue: runIssue,
					matchers: matchersForRun(perRun[runs.indexOf(run)], merged, picks)
				}).unwrap()
			);
		} catch (error) {
			toast.error(classifyErrorText(error), { id });

			throw error;
		}

		const { classified, failed } = outcome;

		if (!classified.length) {
			toast.error(
				runs.length === 1
					? classifyErrorText(failed[0].error)
					: `Could not classify the results\n${notClassifiedText(failed)}`,
				{ id }
			);

			// Thrown on, so the form shows what the server said of its fields.
			throw failed[0].error;
		}

		const { title, description } = classifiedToast({
			categories: input.categories,
			expected: input.expected ?? null,
			scope: input.scope,
			count: classified.reduce((sum, run) => sum + run.resultIds.length, 0),
			runCount: classified.length,
			testCount
		});

		if (failed.length) {
			toast.warning(title, {
				id,
				description: `${description}\nNot classified, still selected:\n${notClassifiedText(
					failed
				)}`
			});
		} else {
			toast.success(title, { id, description });
		}

		return outcome;
	}

	return { submit, canClassify, isLoading: mutationState.isLoading };
}
