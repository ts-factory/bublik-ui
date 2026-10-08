/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useEffect } from 'react';
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useRunSidebarState } from './use-run-sidebar-state';

const setSearchParamsMock = vi.fn();
const locationState = { openUnexpected: true };

// Mutated per-test: the hook anchors on the run id in the current path.
let currentPathname = '/';

// Values returned by the mocked getSidebarStateString, keyed by sidebar key.
// Tests mutate this to simulate different `_s` contents.
const sidebarStateValues: Record<string, string | null> = {};

vi.mock('@/router', async () => {
	const actual = await vi.importActual<typeof import('@/router')>('@/router');

	return {
		...actual,
		useLocation: () => ({ state: locationState, pathname: currentPathname }),
		useSearchParams: () => [new URLSearchParams(), setSearchParamsMock]
	};
});

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

vi.mock('@/bublik/features/sidebar', () => ({
	RUN_SIDEBAR_KEYS: {
		LAST_DETAILS: 'sidebar.run.lastDetails',
		LAST_REPORT: 'sidebar.run.lastReport',
		LAST_ISSUES: 'sidebar.run.lastIssues',
		LAST_MODE: 'sidebar.run.lastMode'
	},
	SHARED_SIDEBAR_KEYS: {
		CURRENT_RUN_ID: 'sidebar.currentRunId'
	},
	getSidebarStateString: (_params: URLSearchParams, key: string) =>
		sidebarStateValues[key] ?? null,
	setSidebarStateValue: (
		sidebarState: Record<string, string>,
		key: string,
		value: string | null | undefined
	) => {
		if (value === null || value === undefined) {
			delete sidebarState[key];
			return;
		}

		sidebarState[key] = value;
	},
	useSidebarStateWriter:
		() => (updater: (sidebarState: Record<string, string>) => void) => {
			const next = new URLSearchParams(window.location.search);
			const previous = next.toString();
			const state: Record<string, string> = {};

			updater(state);
			next.set('_s', JSON.stringify(state));

			if (next.toString() === previous) {
				return;
			}

			setSearchParamsMock(next, { replace: true, state: locationState });
		},
	stripSidebarParamsFromUrl: (url: string) => url,
	extractRunIdFromUrl: (url: string) => url.match(/\/runs\/(\d+)/)?.[1] ?? null,
	extractRunIdFromLogUrl: (url: string) =>
		url.match(/\/log\/(\d+)/)?.[1] ?? null,
	RUN_MODE_DEFAULT: 'details',
	getRunDetailsDefaultUrl: (runId: string) => `/runs/${runId}`,
	getRunIssuesDefaultUrl: (runId: string) => `/runs/${runId}/issues`,
	LOG_SIDEBAR_KEYS: {
		LAST_LOG: 'sidebar.log.lastLog',
		LAST_MODE: 'sidebar.log.lastMode'
	},
	LOG_MODE_DEFAULT: 'treeAndinfoAndlog',
	getLogDefaultUrl: (runId: string) => `/log/${runId}`,
	getBaseUrl: (url: string) => url.replace(/[?&]mode=[^&]*/, ''),
	addModeToUrl: (url: string, mode: string) =>
		`${url}${url.includes('?') ? '&' : '?'}mode=${mode}`
}));

function HookRunner() {
	const { setLastVisited } = useRunSidebarState();

	useEffect(() => {
		setLastVisited('details', '/runs/42');
	}, [setLastVisited]);

	return null;
}

function AvailabilityRunner({
	onState
}: {
	onState: (isDetailsAvailable: boolean) => void;
}) {
	const { isDetailsAvailable } = useRunSidebarState();

	onState(isDetailsAvailable);

	return null;
}

function IssuesAvailabilityRunner({
	onState
}: {
	onState: (state: { isIssuesAvailable: boolean; issueCount: number }) => void;
}) {
	const { isIssuesAvailable, issueCount } = useRunSidebarState();

	onState({ isIssuesAvailable, issueCount });

	return null;
}

function OpenIssueCountRunner({
	onCount
}: {
	onCount: (count: number) => void;
}) {
	onCount(useRunSidebarState().openIssueCount);

	return null;
}

function renderIssuesAvailability() {
	let state = { isIssuesAvailable: false, issueCount: -1 };

	render(<IssuesAvailabilityRunner onState={(value) => (state = value)} />);

	return state;
}

function renderUrls() {
	let urls = { detailsUrl: '', issuesUrl: '' };

	function UrlsRunner() {
		const { detailsUrl, issuesUrl } = useRunSidebarState();
		urls = { detailsUrl, issuesUrl };
		return null;
	}

	render(<UrlsRunner />);

	return urls;
}

function renderLog() {
	let log = {
		logUrl: '',
		mainLinkUrl: '',
		isLogAvailable: false,
		getLogModeUrl: (() => '') as (mode: string) => string
	};

	function LogRunner() {
		const { logUrl, mainLinkUrl, isLogAvailable, getLogModeUrl } =
			useRunSidebarState();
		log = { logUrl, mainLinkUrl, isLogAvailable, getLogModeUrl };
		return null;
	}

	render(<LogRunner />);

	return log;
}

describe('useRunSidebarState', () => {
	beforeEach(() => {
		currentPathname = '/';
		setSearchParamsMock.mockClear();
		for (const key of Object.keys(sidebarStateValues)) {
			delete sidebarStateValues[key];
		}
		runIssuesResult.data = undefined;
		runIssuesResult.isLoading = false;
	});

	it('preserves navigation state while updating sidebar params', async () => {
		render(<HookRunner />);

		await waitFor(() => {
			expect(setSearchParamsMock).toHaveBeenCalledWith(expect.anything(), {
				replace: true,
				state: locationState
			});
		});
	});

	it('keeps details available when the cached URL is pruned but the run id survives', () => {
		// Simulates `lastDetails` dropped by prune while `cr` (currentRunId) remains.
		sidebarStateValues['sidebar.run.lastDetails'] = null;
		sidebarStateValues['sidebar.currentRunId'] = '42';

		let isDetailsAvailable = false;
		render(
			<AvailabilityRunner onState={(value) => (isDetailsAvailable = value)} />
		);

		expect(isDetailsAvailable).toBe(true);
	});

	it('marks details unavailable when neither cached URL nor run id is present', () => {
		let isDetailsAvailable = true;
		render(
			<AvailabilityRunner onState={(value) => (isDetailsAvailable = value)} />
		);

		expect(isDetailsAvailable).toBe(false);
	});

	it('marks issues unavailable when the run has no classified results', () => {
		sidebarStateValues['sidebar.currentRunId'] = '42';
		runIssuesResult.data = [];

		expect(renderIssuesAvailability()).toEqual({
			isIssuesAvailable: false,
			issueCount: 0
		});
	});

	it('marks issues available once the run has at least one issue', () => {
		sidebarStateValues['sidebar.currentRunId'] = '42';
		runIssuesResult.data = [{ issue_id: 1 }];

		expect(renderIssuesAvailability()).toEqual({
			isIssuesAvailable: true,
			issueCount: 1
		});
	});

	it('counts only the open issues for the badge, closed ones still available', () => {
		sidebarStateValues['sidebar.currentRunId'] = '42';
		runIssuesResult.data = [
			{ issue_id: 1, state: 'open' },
			{ issue_id: 2, state: 'closed' }
		];
		let openIssueCount = -1;

		render(
			<OpenIssueCountRunner onCount={(value) => (openIssueCount = value)} />
		);

		expect(openIssueCount).toBe(1);
		expect(renderIssuesAvailability()).toEqual({
			isIssuesAvailable: true,
			issueCount: 2
		});
	});

	it('trusts a previous visit while the issue count is still loading', () => {
		sidebarStateValues['sidebar.currentRunId'] = '42';
		runIssuesResult.isLoading = true;

		expect(renderIssuesAvailability().isIssuesAvailable).toBe(false);

		sidebarStateValues['sidebar.run.lastIssues'] = '/runs/42/issues';

		expect(renderIssuesAvailability().isIssuesAvailable).toBe(true);
	});

	it('ignores a remembered URL left behind by another run', () => {
		sidebarStateValues['sidebar.currentRunId'] = '200';
		sidebarStateValues['sidebar.run.lastDetails'] = '/runs/100?foo=1';
		sidebarStateValues['sidebar.run.lastIssues'] = '/runs/100/issues';

		expect(renderUrls()).toEqual({
			detailsUrl: '/runs/200',
			issuesUrl: '/runs/200/issues'
		});
	});

	it('keeps a remembered URL that belongs to the active run', () => {
		sidebarStateValues['sidebar.currentRunId'] = '200';
		sidebarStateValues['sidebar.run.lastDetails'] = '/runs/200?foo=1';

		expect(renderUrls().detailsUrl).toBe('/runs/200?foo=1');
	});

	it('anchors on the run in the URL before the writer catches up', () => {
		currentPathname = '/runs/300';
		sidebarStateValues['sidebar.currentRunId'] = '200';
		sidebarStateValues['sidebar.run.lastDetails'] = '/runs/200';
		sidebarStateValues['sidebar.run.lastIssues'] = '/runs/200/issues';

		expect(renderUrls()).toEqual({
			detailsUrl: '/runs/300',
			issuesUrl: '/runs/300/issues'
		});
	});

	it('follows the run of the log page as well', () => {
		currentPathname = '/log/500';
		sidebarStateValues['sidebar.currentRunId'] = '200';
		sidebarStateValues['sidebar.run.lastDetails'] = '/runs/200';

		expect(renderUrls().detailsUrl).toBe('/runs/500');
	});

	it('drops the other runs URLs when the recorded run changes', async () => {
		render(<HookRunner />);

		await waitFor(() => expect(setSearchParamsMock).toHaveBeenCalled());

		const [params] = setSearchParamsMock.mock.calls[0];

		expect(JSON.parse(params.get('_s') as string)).toEqual({
			'sidebar.run.lastMode': 'details',
			'sidebar.currentRunId': '42',
			'sidebar.run.lastDetails': '/runs/42'
		});
	});

	it('sends the Run link to details when the last mode has no issues left', () => {
		sidebarStateValues['sidebar.currentRunId'] = '42';
		sidebarStateValues['sidebar.run.lastMode'] = 'issues';
		sidebarStateValues['sidebar.run.lastIssues'] = '/runs/42/issues';
		runIssuesResult.data = [];

		let mainLinkUrl = '';

		function MainLinkRunner() {
			mainLinkUrl = useRunSidebarState().mainLinkUrl;
			return null;
		}

		render(<MainLinkRunner />);

		expect(mainLinkUrl).toBe('/runs/42');
	});
	it('builds the log links from the run when nothing is remembered', () => {
		sidebarStateValues['sidebar.currentRunId'] = '42';

		const log = renderLog();

		expect(log.isLogAvailable).toBe(true);
		expect(log.logUrl).toBe('/log/42?mode=treeAndinfoAndlog');
		// A bare log URL already is the log-only layout.
		expect(log.getLogModeUrl('log')).toBe('/log/42');
		expect(log.getLogModeUrl('treeAndlog')).toBe('/log/42?mode=treeAndlog');
	});

	it('opens the remembered log page in the remembered layout', () => {
		sidebarStateValues['sidebar.currentRunId'] = '42';
		sidebarStateValues['sidebar.log.lastLog'] = '/log/42?focusId=7&mode=log';
		sidebarStateValues['sidebar.log.lastMode'] = 'infoAndlog';

		const log = renderLog();

		expect(log.logUrl).toBe('/log/42?focusId=7&mode=infoAndlog');
		expect(log.getLogModeUrl('log')).toBe('/log/42?focusId=7&mode=log');
	});

	it('ignores a remembered log page left behind by another run', () => {
		sidebarStateValues['sidebar.currentRunId'] = '200';
		sidebarStateValues['sidebar.log.lastLog'] = '/log/100?focusId=7';

		expect(renderLog().logUrl).toBe('/log/200?mode=treeAndinfoAndlog');
	});

	it('has no log to link without a run', () => {
		const log = renderLog();

		expect(log.isLogAvailable).toBe(false);
		expect(log.logUrl).toBe('/log');
	});

	it('points the Run link at the log once the log was the last page', () => {
		sidebarStateValues['sidebar.currentRunId'] = '42';
		sidebarStateValues['sidebar.run.lastMode'] = 'log';
		sidebarStateValues['sidebar.log.lastLog'] = '/log/42?mode=treeAndlog';
		sidebarStateValues['sidebar.log.lastMode'] = 'treeAndlog';

		expect(renderLog().mainLinkUrl).toBe('/log/42?mode=treeAndlog');
	});
});
