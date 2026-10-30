/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import {
	classifyTargets,
	isClassifiable,
	toSelected,
	type SelectableResult
} from './result-selection.utils';

function row(
	overrides: Partial<SelectableResult> & { result_id: number }
): SelectableResult {
	return { run_id: 1, has_error: true, ...overrides };
}

const STAMP = { expected: true, issue_state: 'open' as const };

function selection(...rows: SelectableResult[]) {
	return new Map(rows.map((r) => [r.result_id, toSelected(r)]));
}

describe('isClassifiable', () => {
	it('takes a failure', () => {
		expect(isClassifiable(row({ result_id: 1 }))).toBe(true);
	});

	it('takes a pass that carries a stamp', () => {
		expect(
			isClassifiable(row({ result_id: 1, has_error: false, issues: [STAMP] }))
		).toBe(true);
	});

	it('takes a failure held back by an expected stamp', () => {
		expect(
			isClassifiable(
				row({ result_id: 1, has_error: false, effective_expected: true })
			)
		).toBe(true);
	});

	it('refuses a plain pass', () => {
		expect(isClassifiable(row({ result_id: 1, has_error: false }))).toBe(false);
	});
});

describe('toSelected', () => {
	it('keeps the ids the request and the drawer need, and whether Classify may take it', () => {
		expect(toSelected(row({ result_id: 5, run_id: 7, project_id: 3 }))).toEqual(
			{ resultId: 5, runId: 7, projectId: 3, classifiable: true }
		);
		expect(
			toSelected(row({ result_id: 6, has_error: false })).classifiable
		).toBe(false);
	});
});

describe('classifyTargets', () => {
	it('sends the classifiable results of one run', () => {
		expect(
			classifyTargets(
				selection(
					row({ result_id: 1, project_id: 3 }),
					row({ result_id: 2, has_error: false, issues: [STAMP] })
				)
			)
		).toEqual({
			ok: true,
			resultIds: [1, 2],
			runs: [{ runId: 1, resultIds: [1, 2] }],
			projectId: 3
		});
	});

	it('leaves out a plain pass a stored selection still holds', () => {
		const targets = classifyTargets(
			selection(row({ result_id: 1 }), row({ result_id: 2, has_error: false }))
		);

		expect(targets).toEqual({
			ok: true,
			resultIds: [1],
			runs: [{ runId: 1, resultIds: [1] }],
			projectId: undefined
		});
	});

	it('refuses a selection with nothing to classify', () => {
		expect(
			classifyTargets(selection(row({ result_id: 2, has_error: false })))
		).toEqual({ ok: false, reason: 'nothing-classifiable' });
		expect(classifyTargets(new Map())).toEqual({
			ok: false,
			reason: 'nothing-classifiable'
		});
	});

	it('groups the results of several runs by run, runs in the order first picked', () => {
		expect(
			classifyTargets(
				selection(
					row({ result_id: 4, run_id: 8, project_id: 3 }),
					row({ result_id: 1, run_id: 7, project_id: 3 }),
					row({ result_id: 5, run_id: 8, project_id: 3 })
				)
			)
		).toEqual({
			ok: true,
			resultIds: [4, 1, 5],
			runs: [
				{ runId: 8, resultIds: [4, 5] },
				{ runId: 7, resultIds: [1] }
			],
			projectId: 3
		});
	});

	it('refuses classifiable results of several projects', () => {
		expect(
			classifyTargets(
				selection(
					row({ result_id: 1, run_id: 7, project_id: 3 }),
					row({ result_id: 2, run_id: 8, project_id: 4 })
				)
			)
		).toEqual({ ok: false, reason: 'several-projects' });
	});

	it('does not let a result with no project named split the selection', () => {
		expect(
			classifyTargets(
				selection(
					row({ result_id: 1, run_id: 7, project_id: 3 }),
					row({ result_id: 2, run_id: 8 })
				)
			)
		).toMatchObject({ ok: true, projectId: 3 });
	});

	it('does not let a pass of another project block the classifiable ones', () => {
		expect(
			classifyTargets(
				selection(
					row({ result_id: 1, run_id: 7, project_id: 3 }),
					row({ result_id: 2, run_id: 8, project_id: 4, has_error: false })
				)
			)
		).toMatchObject({
			ok: true,
			runs: [{ runId: 7, resultIds: [1] }],
			resultIds: [1]
		});
	});
});
