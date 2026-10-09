/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useEffect } from 'react';
import { waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
	LOG_SIDEBAR_KEYS,
	RUN_MODE_DEFAULT,
	RUN_SIDEBAR_KEYS,
	SHARED_SIDEBAR_KEYS,
	getSidebarState,
	getSidebarStateString,
	updateSidebarStateSearchParams
} from '@/bublik/features/sidebar';
import { renderWithRouter, type TestRouter } from '@/router/testing';

import { useRunSidebarState } from './use-run-sidebar-state';

// Mutated per-test to simulate the run-issues query resolving.
const runIssuesResult: { data: unknown[] | undefined; isLoading: boolean } = {
	data: undefined,
	isLoading: false
};

vi.mock('@/services/bublik-api', () => ({
	useGetRunReportConfigsQuery: () => ({ data: undefined, isLoading: false }),
	useGetRunDetailsQuery: () => ({ data: { project_id: 1 } }),
	useGetRunIssuesQuery: () => runIssuesResult
}));

/** A query string carrying `values` in the sidebar state (`_s`). */
function withSidebarState(values: Record<string, string>): string {
	const params = updateSidebarStateSearchParams(
		new URLSearchParams(),
		(sidebarState) => Object.assign(sidebarState, values)
	);

	return params?.toString() ?? '';
}

/** A sidebar state value in the address bar. */
function sidebarValue(router: TestRouter, key: string) {
	return getSidebarStateString(
		new URLSearchParams(router.history.location.search),
		key
	);
}

/** What the hook reports when rendered at `path` with `sidebarState` in `_s`. */
async function renderState(
	sidebarState: Record<string, string> = {},
	path = '/'
) {
	let state = {} as ReturnType<typeof useRunSidebarState>;

	function Runner() {
		state = useRunSidebarState();
		return null;
	}

	await renderWithRouter(<Runner />, {
		path,
		search: withSidebarState(sidebarState)
	});

	return state;
}

function HookRunner() {
	const { setLastVisited } = useRunSidebarState();

	useEffect(() => {
		setLastVisited('details', '/runs/42');
	}, [setLastVisited]);

	return null;
}

describe('useRunSidebarState', () => {
	beforeEach(() => {
		runIssuesResult.data = undefined;
		runIssuesResult.isLoading = false;
	});

	it('preserves navigation state while updating sidebar params', async () => {
		const { router } = await renderWithRouter(<HookRunner />, {
			path: '/runs/42',
			state: { openUnexpected: true }
		});

		await waitFor(() =>
			expect(sidebarValue(router, SHARED_SIDEBAR_KEYS.CURRENT_RUN_ID)).toBe(
				'42'
			)
		);
		expect(router.history.location.state).toMatchObject({
			openUnexpected: true
		});
		expect(router.history.length).toBe(1);
	});

	it('keeps details available when the cached URL is pruned but the run id survives', async () => {
		// `lastDetails` dropped by prune while `cr` (currentRunId) remains.
		const state = await renderState({
			[SHARED_SIDEBAR_KEYS.CURRENT_RUN_ID]: '42'
		});

		expect(state.isDetailsAvailable).toBe(true);
	});

	it('marks details unavailable when neither cached URL nor run id is present', async () => {
		const state = await renderState();

		expect(state.isDetailsAvailable).toBe(false);
	});

	it('marks issues unavailable when the run has no classified results', async () => {
		runIssuesResult.data = [];

		const state = await renderState({
			[SHARED_SIDEBAR_KEYS.CURRENT_RUN_ID]: '42'
		});

		expect(state).toMatchObject({ isIssuesAvailable: false, issueCount: 0 });
	});

	it('marks issues available once the run has at least one issue', async () => {
		runIssuesResult.data = [{ issue_id: 1 }];

		const state = await renderState({
			[SHARED_SIDEBAR_KEYS.CURRENT_RUN_ID]: '42'
		});

		expect(state).toMatchObject({ isIssuesAvailable: true, issueCount: 1 });
	});

	it('counts only the open issues for the badge, closed ones still available', async () => {
		runIssuesResult.data = [
			{ issue_id: 1, state: 'open' },
			{ issue_id: 2, state: 'closed' }
		];

		const state = await renderState({
			[SHARED_SIDEBAR_KEYS.CURRENT_RUN_ID]: '42'
		});

		expect(state).toMatchObject({
			openIssueCount: 1,
			isIssuesAvailable: true,
			issueCount: 2
		});
	});

	it('trusts a previous visit while the issue count is still loading', async () => {
		runIssuesResult.isLoading = true;

		const unvisited = await renderState({
			[SHARED_SIDEBAR_KEYS.CURRENT_RUN_ID]: '42'
		});
		expect(unvisited.isIssuesAvailable).toBe(false);

		const visited = await renderState({
			[SHARED_SIDEBAR_KEYS.CURRENT_RUN_ID]: '42',
			[RUN_SIDEBAR_KEYS.LAST_ISSUES]: '/runs/42/issues'
		});
		expect(visited.isIssuesAvailable).toBe(true);
	});

	it('ignores a remembered URL left behind by another run', async () => {
		const state = await renderState({
			[SHARED_SIDEBAR_KEYS.CURRENT_RUN_ID]: '200',
			[RUN_SIDEBAR_KEYS.LAST_DETAILS]: '/runs/100?foo=1',
			[RUN_SIDEBAR_KEYS.LAST_ISSUES]: '/runs/100/issues'
		});

		expect(state).toMatchObject({
			detailsUrl: '/runs/200',
			issuesUrl: '/runs/200/issues'
		});
	});

	it('keeps a remembered URL that belongs to the active run', async () => {
		const state = await renderState({
			[SHARED_SIDEBAR_KEYS.CURRENT_RUN_ID]: '200',
			[RUN_SIDEBAR_KEYS.LAST_DETAILS]: '/runs/200?foo=1'
		});

		expect(state.detailsUrl).toBe('/runs/200?foo=1');
	});

	it('anchors on the run in the URL before the writer catches up', async () => {
		const state = await renderState(
			{
				[SHARED_SIDEBAR_KEYS.CURRENT_RUN_ID]: '200',
				[RUN_SIDEBAR_KEYS.LAST_DETAILS]: '/runs/200',
				[RUN_SIDEBAR_KEYS.LAST_ISSUES]: '/runs/200/issues'
			},
			'/runs/300'
		);

		expect(state).toMatchObject({
			detailsUrl: '/runs/300',
			issuesUrl: '/runs/300/issues'
		});
	});

	it('follows the run of the log page as well', async () => {
		const state = await renderState(
			{
				[SHARED_SIDEBAR_KEYS.CURRENT_RUN_ID]: '200',
				[RUN_SIDEBAR_KEYS.LAST_DETAILS]: '/runs/200'
			},
			'/log/500'
		);

		expect(state.detailsUrl).toBe('/runs/500');
	});

	it('drops the other runs URLs when the recorded run changes', async () => {
		const { router } = await renderWithRouter(<HookRunner />, {
			path: '/runs/42',
			search: withSidebarState({
				[SHARED_SIDEBAR_KEYS.CURRENT_RUN_ID]: '100',
				[RUN_SIDEBAR_KEYS.LAST_ISSUES]: '/runs/100/issues',
				[RUN_SIDEBAR_KEYS.LAST_MODE]: 'issues'
			})
		});

		await waitFor(() =>
			expect(sidebarValue(router, SHARED_SIDEBAR_KEYS.CURRENT_RUN_ID)).toBe(
				'42'
			)
		);
		const sidebarState = getSidebarState(
			new URLSearchParams(router.history.location.search)
		);

		// Every run key, the mode read as the hook reads it: `details` is the
		// default and is left out of `_s`.
		expect({
			mode: sidebarState[RUN_SIDEBAR_KEYS.LAST_MODE] ?? RUN_MODE_DEFAULT,
			runId: sidebarState[SHARED_SIDEBAR_KEYS.CURRENT_RUN_ID],
			details: sidebarState[RUN_SIDEBAR_KEYS.LAST_DETAILS],
			report: sidebarState[RUN_SIDEBAR_KEYS.LAST_REPORT],
			issues: sidebarState[RUN_SIDEBAR_KEYS.LAST_ISSUES]
		}).toEqual({
			mode: 'details',
			runId: '42',
			details: '/runs/42',
			report: undefined,
			issues: undefined
		});
	});

	it('sends the Run link to details when the last mode has no issues left', async () => {
		runIssuesResult.data = [];

		const state = await renderState({
			[SHARED_SIDEBAR_KEYS.CURRENT_RUN_ID]: '42',
			[RUN_SIDEBAR_KEYS.LAST_MODE]: 'issues',
			[RUN_SIDEBAR_KEYS.LAST_ISSUES]: '/runs/42/issues'
		});

		expect(state.mainLinkUrl).toBe('/runs/42');
	});

	it('builds the log links from the run when nothing is remembered', async () => {
		const log = await renderState({
			[SHARED_SIDEBAR_KEYS.CURRENT_RUN_ID]: '42'
		});

		expect(log.isLogAvailable).toBe(true);
		expect(log.logUrl).toBe('/log/42?mode=treeAndinfoAndlog');
		// The sidebar state derives the run's log page from the run id, so the
		// log-only layout is named too rather than left as a bare log URL.
		expect(log.getLogModeUrl('log')).toBe('/log/42?mode=log');
		expect(log.getLogModeUrl('treeAndlog')).toBe('/log/42?mode=treeAndlog');
	});

	it('opens the remembered log page in the remembered layout', async () => {
		const log = await renderState({
			[SHARED_SIDEBAR_KEYS.CURRENT_RUN_ID]: '42',
			[LOG_SIDEBAR_KEYS.LAST_LOG]: '/log/42?focusId=7&mode=log',
			[LOG_SIDEBAR_KEYS.LAST_MODE]: 'infoAndlog'
		});

		expect(log.logUrl).toBe('/log/42?focusId=7&mode=infoAndlog');
		expect(log.getLogModeUrl('log')).toBe('/log/42?focusId=7&mode=log');
	});

	it('ignores a remembered log page left behind by another run', async () => {
		const log = await renderState({
			[SHARED_SIDEBAR_KEYS.CURRENT_RUN_ID]: '200',
			[LOG_SIDEBAR_KEYS.LAST_LOG]: '/log/100?focusId=7'
		});

		expect(log.logUrl).toBe('/log/200?mode=treeAndinfoAndlog');
	});

	it('has no log to link without a run', async () => {
		const log = await renderState();

		expect(log.isLogAvailable).toBe(false);
		expect(log.logUrl).toBe('/log');
	});

	it('points the Run link at the log once the log was the last page', async () => {
		const log = await renderState({
			[SHARED_SIDEBAR_KEYS.CURRENT_RUN_ID]: '42',
			[RUN_SIDEBAR_KEYS.LAST_MODE]: 'log',
			[LOG_SIDEBAR_KEYS.LAST_LOG]: '/log/42?mode=treeAndlog',
			[LOG_SIDEBAR_KEYS.LAST_MODE]: 'treeAndlog'
		});

		expect(log.mainLinkUrl).toBe('/log/42?mode=treeAndlog');
	});
});
