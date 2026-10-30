/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import type { ClassifyResponse } from '@/shared/types';

import { classifyInTurn, notClassifiedText } from './classify-runs.utils';
import type { RunResults } from './result-selection.utils';

const NEW_ISSUE = { title: 'Link flaps', bug_key: null };

const RUNS: RunResults[] = [
	{ runId: 7, resultIds: [1, 2] },
	{ runId: 8, resultIds: [3] },
	{ runId: 9, resultIds: [4] }
];

const BAD_MATCHERS = {
	status: 400,
	data: { messages: { matchers: ['rx_fcs: tags not among the run tags.'] } }
};

/** Answers each request in turn, recording what it was sent and when. */
function recorder(fail: Record<number, unknown> = {}) {
	const sent: { runId?: number; issue: unknown }[] = [];
	let inFlight = 0;
	let overlapped = false;

	async function send(
		run: RunResults,
		issue: number | typeof NEW_ISSUE
	): Promise<ClassifyResponse> {
		inFlight += 1;
		overlapped ||= inFlight > 1;
		sent.push({ runId: run.runId, issue });
		await Promise.resolve();
		inFlight -= 1;

		if (run.runId !== undefined && run.runId in fail) throw fail[run.runId];

		return { issue_id: typeof issue === 'number' ? issue : 50, rule_ids: [] };
	}

	return { send, sent, overlapped: () => overlapped };
}

describe('classifyInTurn', () => {
	it('sends one request per run, one after another, in order', async () => {
		const { send, sent, overlapped } = recorder();

		await classifyInTurn(RUNS, 12, send);

		expect(sent.map((request) => request.runId)).toEqual([7, 8, 9]);
		expect(overlapped()).toBe(false);
	});

	it('files the new issue with the first run, and the later runs under it', async () => {
		const { send, sent } = recorder();

		const outcome = await classifyInTurn(RUNS, NEW_ISSUE, send);

		expect(sent.map((request) => request.issue)).toEqual([NEW_ISSUE, 50, 50]);
		expect(outcome.issueId).toBe(50);
	});

	it('sends an existing issue to every run', async () => {
		const { send, sent } = recorder();

		await classifyInTurn(RUNS, 12, send);

		expect(sent.map((request) => request.issue)).toEqual([12, 12, 12]);
	});

	it('goes on past a run that fails, and reports it', async () => {
		const { send, sent } = recorder({ 8: BAD_MATCHERS });

		const outcome = await classifyInTurn(RUNS, NEW_ISSUE, send);

		expect(sent.map((request) => request.runId)).toEqual([7, 8, 9]);
		expect(outcome.classified).toEqual([RUNS[0], RUNS[2]]);
		expect(outcome.failed).toEqual([{ run: RUNS[1], error: BAD_MATCHERS }]);
	});

	it('lets the next run file the new issue when the first one fails', async () => {
		const { send, sent } = recorder({ 7: BAD_MATCHERS });

		const outcome = await classifyInTurn(RUNS, NEW_ISSUE, send);

		expect(sent.map((request) => request.issue)).toEqual([
			NEW_ISSUE,
			NEW_ISSUE,
			50
		]);
		expect(outcome.issueId).toBe(50);
	});

	it('has no issue when every run fails', async () => {
		const { send } = recorder({
			7: BAD_MATCHERS,
			8: BAD_MATCHERS,
			9: BAD_MATCHERS
		});

		const outcome = await classifyInTurn(RUNS, NEW_ISSUE, send);

		expect(outcome.issueId).toBeNull();
		expect(outcome.classified).toEqual([]);
		expect(outcome.failed).toHaveLength(3);
	});
});

describe('classifyInTurn, when the new issue itself is refused', () => {
	const BAD_ISSUE = {
		status: 400,
		data: { messages: { issue: { bug_key: ['Bug key is taken.'] } } }
	};

	it('stops there, reporting every run as not classified, the rest unsent', async () => {
		const { send, sent } = recorder({ 7: BAD_ISSUE });

		const outcome = await classifyInTurn(RUNS, NEW_ISSUE, send);

		expect(sent.map((request) => request.runId)).toEqual([7]);
		expect(outcome.issueId).toBeNull();
		expect(outcome.failed).toEqual(
			RUNS.map((run) => ({ run, error: BAD_ISSUE }))
		);
	});

	it('goes on once the issue exists, as the later runs only name it', async () => {
		const { send, sent } = recorder({ 8: BAD_ISSUE });

		await classifyInTurn(RUNS, NEW_ISSUE, send);

		expect(sent.map((request) => request.runId)).toEqual([7, 8, 9]);
	});
});

describe('notClassifiedText', () => {
	it('names each run that failed, with what the server said', () => {
		expect(
			notClassifiedText([
				{ run: RUNS[1], error: BAD_MATCHERS },
				{ run: RUNS[2], error: BAD_MATCHERS }
			])
		).toBe(
			'Run 8, 1 result: Match scope: rx_fcs: tags not among the run tags.\n' +
				'Run 9, 1 result: Match scope: rx_fcs: tags not among the run tags.'
		);
	});
});
