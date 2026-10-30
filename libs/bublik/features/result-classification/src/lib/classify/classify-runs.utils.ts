/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { ClassifyNewIssue, ClassifyResponse } from '@/shared/types';

import { classifyErrorText, resultsInRuns } from './classify.utils';
import type { RunResults } from './result-selection.utils';

/** A run whose request failed, and why. */
export interface RunFailure {
	run: RunResults;
	error: unknown;
}

export interface ClassifyInTurnOutcome {
	/** The issue the results went under, or null when no run was classified. */
	issueId: number | null;
	classified: RunResults[];
	failed: RunFailure[];
}

/** Whether the server refused the issue itself, rather than the run's results. */
function refusesIssue(error: unknown): boolean {
	const messages = (error as { data?: { messages?: unknown } } | null)?.data
		?.messages;

	return (
		typeof messages === 'object' &&
		messages !== null &&
		!Array.isArray(messages) &&
		'issue' in messages
	);
}

/**
 * Classifies a selection run by run, one request at a time: the server takes
 * the results of one run per request. The first request to go through files
 * a new issue, and the runs after it are classified under that issue; rules
 * are get-or-create, so runs sending the same matcher share a rule. A run
 * that fails does not stop the others, and is reported with its error: what
 * the earlier ones wrote is kept. A new issue the server refuses would be
 * refused for every run, so that stops it: the rest are not sent.
 */
export async function classifyInTurn<Issue extends ClassifyNewIssue>(
	runs: readonly RunResults[],
	issue: number | Issue,
	send: (run: RunResults, issue: number | Issue) => Promise<ClassifyResponse>
): Promise<ClassifyInTurnOutcome> {
	let current: number | Issue = issue;
	const classified: RunResults[] = [];
	const failed: RunFailure[] = [];

	for (const [index, run] of runs.entries()) {
		try {
			const response = await send(run, current);

			current = response.issue_id;
			classified.push(run);
		} catch (error) {
			if (typeof current !== 'number' && refusesIssue(error)) {
				failed.push(...runs.slice(index).map((left) => ({ run: left, error })));
				break;
			}

			failed.push({ run, error });
		}
	}

	return {
		issueId: typeof current === 'number' ? current : null,
		classified,
		failed
	};
}

/** A line per run that failed: the run, how many results, and why. */
export function notClassifiedText(failed: readonly RunFailure[]): string {
	return failed
		.map(({ run, error }) => {
			const what = resultsInRuns(run.resultIds.length, 1);
			const where =
				run.runId === undefined ? what : `Run ${run.runId}, ${what}`;

			return `${where}: ${classifyErrorText(error)}`;
		})
		.join('\n');
}
