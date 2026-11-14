/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { ResultIssueRef } from '@/shared/types';

import { resultClassification } from '../classification/classification.utils';

/** What a result table row has to say for the selection to take it. */
export interface SelectableResult {
	result_id: number;
	run_id: number;
	project_id?: number;
	has_error: boolean;
	effective_expected?: boolean;
	issues?: readonly Pick<ResultIssueRef, 'expected' | 'issue_state'>[];
}

/** One picked result: what the bulk request and the drawer need of it. */
export interface SelectedResult {
	resultId: number;
	runId: number;
	projectId?: number;
	/**
	 * Whether Classify may take it. Only such results are picked now; a
	 * selection stored before that can still hold a plain pass.
	 */
	classifiable: boolean;
}

/**
 * The rule the Classify button on a row already follows: a failure, or a
 * result that carries a stamp, can be classified; a plain pass cannot.
 */
export function isClassifiable(row: SelectableResult): boolean {
	return (
		resultClassification({
			issues: row.issues,
			hasError: row.has_error,
			effectiveExpected: row.effective_expected
		}) !== null
	);
}

export function toSelected(row: SelectableResult): SelectedResult {
	return {
		resultId: row.result_id,
		runId: row.run_id,
		projectId: row.project_id,
		classifiable: isClassifiable(row)
	};
}

/**
 * The picked results of one run; a selection spanning runs is a list of
 * these, sent in one request. Where the
 * caller does not know the run, as a row's own Classify button does not,
 * `runId` is left out.
 */
export interface RunResults {
	runId?: number;
	resultIds: number[];
}

/** What of a selection Classify would send, or why it cannot. */
export type ClassifyTargets =
	| {
			ok: true;
			/** Every result to classify, in the order picked. */
			resultIds: number[];
			/** The same results by run, runs in the order first picked. */
			runs: RunResults[];
			projectId: number | undefined;
	  }
	| { ok: false; reason: 'nothing-classifiable' | 'several-projects' };

/**
 * The baseline toggle's words, the same on a result row and in the selection
 * popover: its label, and the tooltip that says what the baseline does.
 */
export const BASELINE_TOGGLE = {
	set: {
		label: 'Use as baseline',
		hint: 'Dim the parameters the other results share with this one, so what differs stands out.'
	},
	clear: {
		label: 'Clear baseline',
		hint: 'Stop dimming the parameters the other results share with this one.'
	}
} as const;

export const CLASSIFY_TARGETS_HINT = {
	'nothing-classifiable':
		'None of the selected results can be classified: only failed or classified results can.',
	'several-projects':
		'Only results of one project can be classified at a time: an issue belongs to one project.'
} as const;

/**
 * The classifiable results among the picked ones, grouped by run, as the
 * server classifies one run per request. They have to be of one project:
 * every request files them under one issue, which belongs to one project. A
 * plain pass left in a stored selection is left out.
 */
export function classifyTargets(
	selected: ReadonlyMap<number, SelectedResult>
): ClassifyTargets {
	const targets = Array.from(selected.values()).filter(
		(result) => result.classifiable
	);

	if (!targets.length) return { ok: false, reason: 'nothing-classifiable' };

	const projects = new Set(
		targets.flatMap((result) =>
			result.projectId === undefined ? [] : [result.projectId]
		)
	);

	if (projects.size > 1) return { ok: false, reason: 'several-projects' };

	const runs = new Map<number, number[]>();

	for (const { runId, resultId } of targets) {
		runs.set(runId, [...(runs.get(runId) ?? []), resultId]);
	}

	return {
		ok: true,
		resultIds: targets.map((result) => result.resultId),
		runs: Array.from(runs, ([runId, resultIds]) => ({ runId, resultIds })),
		projectId: projects.values().next().value
	};
}
