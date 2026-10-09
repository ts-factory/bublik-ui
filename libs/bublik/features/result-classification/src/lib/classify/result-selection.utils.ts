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

/** What of a selection Classify would send, or why it cannot. */
export type ClassifyTargets =
	| {
			ok: true;
			resultIds: number[];
			runId: number;
			projectId: number | undefined;
	  }
	| { ok: false; reason: 'nothing-classifiable' | 'several-runs' };

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
	'several-runs': 'Only results of one run can be classified at a time.'
} as const;

/**
 * The classifiable results among the picked ones, which have to be of one
 * run: the server classifies one run per request. A plain pass left in a
 * stored selection is left out.
 */
export function classifyTargets(
	selected: ReadonlyMap<number, SelectedResult>
): ClassifyTargets {
	const targets = Array.from(selected.values()).filter(
		(result) => result.classifiable
	);

	if (!targets.length) return { ok: false, reason: 'nothing-classifiable' };

	const runs = new Set(targets.map((result) => result.runId));

	if (runs.size > 1) return { ok: false, reason: 'several-runs' };

	return {
		ok: true,
		resultIds: targets.map((result) => result.resultId),
		runId: targets[0].runId,
		projectId: targets.find((result) => result.projectId !== undefined)
			?.projectId
	};
}
