/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createMemoryHistory } from '@tanstack/react-router';
import { compressToEncodedURIComponent } from 'lz-string';
import { describe, expect, it, vi } from 'vitest';

import { config } from '@/bublik/config';

import { createAppRouter, type AppRouter } from '../../router';
import {
	adminAnalyticsSearch,
	type AdminAnalyticsSearch
} from './admin-analytics.search';
import { compareSearch, type CompareSearch } from './compare.search';
import { configSearch, type ConfigSearch } from './config.search';
import { dashboardSearch, type DashboardSearch } from './dashboard.search';
import { historySearch, type HistorySearch } from './history.search';
import { importSearch, type ImportSearch } from './import.search';
import {
	issueResultsSearch,
	type IssueResultsSearch
} from './issue-results.search';
import { issueRulesSearch, type IssueRulesSearch } from './issue-rules.search';
import { issueSearch, type IssueSearch } from './issue.search';
import { issuesSearch, type IssuesSearch } from './issues.search';
import { logSearch, type LogSearch } from './log.search';
import { loginSearch, type LoginSearch } from './login.search';
import {
	measurementsSearch,
	type MeasurementsSearch
} from './measurements.search';
import { multipleSearch, type MultipleSearch } from './multiple.search';
import {
	packetViewerSearch,
	type PacketViewerSearch
} from './packet-viewer.search';
import { rootSearch } from './root.search';
import { runIssuesSearch, type RunIssuesSearch } from './run-issues.search';
import {
	isBlockOpen,
	runReportSearch,
	type RunReportSearch
} from './run-report.search';
import { runSearch, type RunSearch } from './run.search';
import { runsSearch, type RunsSearch } from './runs.search';

/**
 * lz-string, as the run table's `CompressedJsonParam` writes it, then
 * percent-encoded as `URLSearchParams` puts it on the URL (`+` is `%2B`).
 */
const lz = (value: unknown) =>
	new URLSearchParams({
		v: compressToEncodedURIComponent(JSON.stringify(value))
	})
		.toString()
		.slice('v='.length);

/**
 * The per-page URL contract, one
 * block per schema: the wire string the e2e tables and the URL snapshot pin,
 * the typed values a page reads for it, and the defaults filled at read time.
 * Both directions go through the real router so the route files' wiring is
 * what is under test, not the schema modules alone.
 */
async function routerAt(url: string): Promise<AppRouter> {
	const router = createAppRouter(
		createMemoryHistory({ initialEntries: [`${config.baseUrl}${url}`] })
	);

	await router.load();

	return router;
}

/** The validated search of the leaf match, root keys included. */
function leafSearch(router: AppRouter): Record<string, unknown> {
	return router.state.matches.at(-1)?.search as Record<string, unknown>;
}

interface Contract {
	/** The route the typed values are built for. */
	to: string;
	params?: Record<string, string>;
	/** The URL under the basepath, as the oracles spell it. */
	wire: string;
	/** What `useSearch()` returns for `wire`, and what builds `wire` back. */
	typed: Record<string, unknown>;
}

/** Wire → typed through `load()`, typed → wire through `buildLocation()`. */
function itRoundTrips({ to, params, wire, typed }: Contract) {
	it(`reads ${wire} as the typed values`, async () => {
		const router = await routerAt(wire);

		expect(leafSearch(router)).toEqual(typed);
	});

	it(`writes the typed values as ${wire}`, async () => {
		const router = await routerAt(
			to.replace(/\$(\w+)/g, (_, k) => params?.[k] ?? '')
		);

		expect(
			router.buildLocation({ to, params, search: typed } as never).href
		).toBe(`${config.baseUrl}${wire}`);
	});
}

describe('root: project, _s, hide-sidebar, settings-open, settings-tab', () => {
	itRoundTrips({
		to: '/dashboard',
		wire: '/dashboard?project=1&project=2&_s=N4IgLgpg&hide-sidebar=1&settings-open=1&settings-tab=appearance',
		typed: {
			project: [1, 2],
			_s: 'N4IgLgpg',
			'hide-sidebar': '1',
			'settings-open': true,
			'settings-tab': 'appearance'
		}
	});

	it('fills the settings defaults at read time only', () => {
		expect(rootSearch.withDefaults({})).toEqual({
			'settings-open': false,
			'settings-tab': 'account'
		});
	});
});

describe('/dashboard', () => {
	const typed = {
		main: new Date(2026, 3, 20),
		mode: 'columns',
		secondary: new Date(2026, 3, 19),
		search: '',
		reload: false,
		tv: true
	} satisfies DashboardSearch;

	itRoundTrips({
		to: '/dashboard',
		wire: '/dashboard?main=2026-04-20&mode=columns&secondary=2026-04-19&search=&reload=0&tv=1',
		typed
	});

	describe('a legacy dates link', () => {
		const blob = (days: Record<string, string>) =>
			window.btoa(JSON.stringify(days));

		it('is rewritten in place to the pinned days, keeping project and _s', async () => {
			const dates = blob({ startDate: '2026-04-19', endDate: '2026-04-20' });
			const router = await routerAt(
				`/dashboard?dates=${dates}&mode=columns&project=3&project=4&_s=abc&tv=1&hide-sidebar=1#top`
			);

			expect(router.history.location.href).toBe(
				`${config.baseUrl}/dashboard?mode=columns&secondary=2026-04-19&main=2026-04-20&project=3&project=4&_s=abc`
			);
			expect(router.history.length).toBe(1);
			expect(leafSearch(router)).toEqual({
				mode: 'columns',
				secondary: new Date(2026, 3, 19),
				main: new Date(2026, 3, 20),
				project: [3, 4],
				_s: 'abc'
			});
		});

		it('pins a single day as the main date', async () => {
			const router = await routerAt(
				`/dashboard?dates=${blob({ main: '2026-04-20' })}&mode=rows`
			);

			expect(router.history.location.href).toBe(
				`${config.baseUrl}/dashboard?mode=rows&main=2026-04-20`
			);
		});

		it('sorts the two days: the later is main, whatever the keys', async () => {
			const router = await routerAt(
				`/dashboard?dates=${blob({
					main: '2026-04-20',
					secondary: '2026-04-22'
				})}`
			);

			expect(router.history.location.href).toBe(
				`${config.baseUrl}/dashboard?secondary=2026-04-20&main=2026-04-22`
			);
		});

		it('replaces the entry it was opened with', async () => {
			const router = await routerAt('/runs');

			await router.navigate({
				href: `/dashboard?dates=${blob({ main: '2026-04-20' })}`
			});

			expect(router.history.location.href).toBe(
				`${config.baseUrl}/dashboard?main=2026-04-20`
			);
			expect(router.history.length).toBe(2);

			router.history.back();
			await vi.waitFor(() =>
				expect(router.history.location.href).toBe(`${config.baseUrl}/runs`)
			);
		});

		it('opens as it is when the blob cannot be read', async () => {
			const warn = vi
				.spyOn(console, 'warn')
				.mockImplementation(() => undefined);
			const router = await routerAt('/dashboard?dates=not-base64!&mode=rows');

			expect(router.history.location.href).toBe(
				`${config.baseUrl}/dashboard?dates=not-base64!&mode=rows`
			);
			expect(leafSearch(router)).toEqual({
				dates: 'not-base64!',
				mode: 'rows'
			});
			warn.mockRestore();
		});
	});

	it('keeps an unparsable day on the URL through an unrelated write', async () => {
		const router = await routerAt('/dashboard?main=not-a-date&mode=rows');

		expect(leafSearch(router)).toMatchObject({ main: 'not-a-date' });

		await router.navigate({
			to: '/dashboard',
			search: (prev: DashboardSearch) => ({ ...prev, _s: 'abc' }),
			replace: true
		});

		expect(router.history.location.href).toBe(
			`${config.baseUrl}/dashboard?main=not-a-date&mode=rows&_s=abc`
		);
	});

	it('defaults reload and tv to off', () => {
		expect(dashboardSearch.withDefaults({})).toEqual({
			reload: false,
			tv: false
		});
	});

	it('passes _s and project through a page schema untouched', async () => {
		const router = await routerAt('/dashboard?tv=1&_s=abc&project=3&foo=bar');

		await router.navigate({
			to: '/dashboard',
			search: (prev: DashboardSearch) => ({ ...prev, tv: false }),
			replace: true
		});

		expect(router.history.location.href).toBe(
			`${config.baseUrl}/dashboard?tv=0&_s=abc&project=3&foo=bar`
		);
	});
});

describe('/history and /history/v2', () => {
	// The form writes every key, empty ones included (`labels=`), and the
	// untriaged/explained boxes as `true` or the empty string.
	const typed = {
		testName: 'example-ci/storage/identify_basic',
		hash: '',
		parameters: ['a=1', 'b=2'],
		labels: [],
		startDate: '2026-04-19',
		finishDate: '2026-04-25',
		results: ['PASSED', 'FAILED'],
		verdictLookup: 'regex',
		untriaged: true,
		explained: false,
		page: '2',
		pageSize: '25',
		mode: 'linear',
		combinedPlots: ['1', '2'],
		'chart-group': 'trend',
		parametersByResultName: ['x', 'y'],
		fromRun: 'true'
	} satisfies HistorySearch;
	const query =
		'?testName=example-ci%2Fstorage%2Fidentify_basic&hash=&parameters=a%3D1%3Bb%3D2&labels=' +
		'&startDate=2026-04-19&finishDate=2026-04-25&results=PASSED%3BFAILED&verdictLookup=regex' +
		'&untriaged=true&explained=&page=2&pageSize=25&mode=linear&combinedPlots=1%3B2&chart-group=trend' +
		'&parametersByResultName=x&parametersByResultName=y&fromRun=true';

	itRoundTrips({ to: '/history', wire: `/history${query}`, typed });
	itRoundTrips({ to: '/history/v2', wire: `/history/v2${query}`, typed });

	it('defaults to linear mode, page 1 of 25, string verdict lookup and empty filters', () => {
		expect(historySearch.withDefaults({})).toEqual({
			testName: '',
			hash: '',
			tagExpr: '',
			labelExpr: '',
			revisionExpr: '',
			branchExpr: '',
			verdictExpr: '',
			testArgExpr: '',
			issue: '',
			parameters: [],
			revisions: [],
			branches: [],
			labels: [],
			runData: [],
			runIds: [],
			runProperties: [],
			resultProperties: [],
			results: [],
			verdict: [],
			categories: [],
			parametersByResultFilter: [],
			parametersByResultName: [],
			verdictLookup: 'string',
			untriaged: false,
			explained: false,
			page: '1',
			pageSize: '25',
			mode: 'linear'
		});
	});
	it.each([
		['the history form writes', '/history?runIds=26764%3B1113&mode=linear'],
		[
			'the multiple-runs page links with',
			'/history?runIds=26764&runIds=1113&selected=26764&mode=aggregation'
		]
	])('keeps runIds as %s it through a write', async (_, wire) => {
		const router = await routerAt(wire);

		await router.navigate({
			to: '/history',
			search: (prev: HistorySearch) => ({ ...prev, _s: 'abc' }),
			replace: true
		});

		expect(router.history.location.href).toBe(
			`${config.baseUrl}${wire}&_s=abc`
		);
	});
});

describe('/log/$runId', () => {
	const typed = {
		focusId: 1138,
		mode: 'treeAndinfoAndlog',
		lineNumber: '1138_42',
		page: '2',
		legacy: false
	} satisfies LogSearch;

	itRoundTrips({
		to: '/log/$runId',
		params: { runId: 1132 },
		wire: '/log/1132?focusId=1138&mode=treeAndinfoAndlog&lineNumber=1138_42&page=2&legacy=false',
		typed
	});

	it('has no read-time defaults: an absent mode is the log on its own', () => {
		expect(logSearch.withDefaults({})).toEqual({});
	});

	it('the legacy /log/$runId/$old address sets the tree mode and keeps the rest', async () => {
		const router = await routerAt(
			'/log/1132/old?focusId=1138&mode=log&project=1'
		);

		expect(router.history.location.href).toBe(
			`${config.baseUrl}/log/1132?focusId=1138&mode=treeAndinfoAndlog&project=1`
		);
	});
});

describe('/runs', () => {
	const typed = {
		startDate: '2026-04-20',
		finishDate: '2026-04-20',
		calendarMode: 'default',
		mode: 'charts',
		page: '2',
		pageSize: '50',
		duration: 'P7D',
		tagExpr: 'foo',
		runData: ['a=b', 'c=d']
	} satisfies RunsSearch;

	itRoundTrips({
		to: '/runs',
		wire: '/runs?startDate=2026-04-20&finishDate=2026-04-20&calendarMode=default&mode=charts&page=2&pageSize=50&duration=P7D&tagExpr=foo&runData=a%3Db%3Bc%3Dd',
		typed
	});

	it('defaults to the table on page 1 of 25 with the default calendar', () => {
		expect(runsSearch.withDefaults({})).toEqual({
			mode: 'table',
			page: '1',
			pageSize: '25',
			calendarMode: 'default'
		});
	});
});

describe('/runs/$runId', () => {
	const typed = {
		expanded: { '0': true },
		sorting: [{ id: 'name', desc: true }],
		globalFilter: ['foo'],
		rowState: { '0': { rowId: '0', showToolbar: true } },
		visibility: { total: false },
		columnFilters: {
			'0': [{ id: 'obtained-result', value: { results: ['FAILED'] } }]
		},
		columnOrder: ['a', 'b'],
		globalRequirements: ['x', 'y'],
		targetIterationId: 11,
		resultFilter: 'UNEXPECTED_TOTAL'
	} satisfies RunSearch;

	itRoundTrips({
		to: '/runs/$runId',
		params: { runId: 1 },
		wire:
			`/runs/1?expanded=${lz(typed.expanded)}&sorting=${lz(typed.sorting)}` +
			`&globalFilter=${lz(typed.globalFilter)}&rowState=${lz(typed.rowState)}` +
			`&visibility=${lz(typed.visibility)}&columnFilters=${lz(
				typed.columnFilters
			)}` +
			'&columnOrder=%5B%22a%22%2C%22b%22%5D&globalRequirements=x&globalRequirements=y' +
			'&targetIterationId=11&resultFilter=UNEXPECTED_TOTAL',
		typed
	});

	it('reads a legacy plain-JSON expanded state', async () => {
		const router = await routerAt('/runs/1?expanded=%7B%220%22%3Atrue%7D');

		expect(leafSearch(router)).toEqual({ expanded: { '0': true } });
	});

	it('has no static defaults: the first row and the stored columns are data', () => {
		expect(runSearch.withDefaults({})).toEqual({});
	});
});

describe('/runs/$runId/report', () => {
	const typed = {
		config: 11,
		isFullMode: false,
		'selected-records': ['rec-1', 'rec-2'],
		'stacked-drawer': true
	} satisfies RunReportSearch;

	itRoundTrips({
		to: '/runs/$runId/report',
		params: { runId: 1726 },
		wire: '/runs/1726/report?config=11&isFullMode=0&selected-records=rec-1&selected-records=rec-2&stacked-drawer=1',
		typed
	});

	it('defaults to the full mode with the stacked drawer closed and nothing selected', () => {
		expect(runReportSearch.withDefaults({})).toEqual({
			isFullMode: true,
			'selected-records': [],
			'stacked-drawer': false
		});
	});

	it('reads a dynamic block toggle as 1/0 and leaves it on the URL as is', async () => {
		const router = await routerAt(
			'/runs/1726/report?config=11&arg-val-block-7=0&test-block-2=1'
		);
		const search = leafSearch(router);

		expect(isBlockOpen(search, 'arg-val-block-7')).toBe(false);
		expect(isBlockOpen(search, 'test-block-2')).toBe(true);
		expect(isBlockOpen(search, 'test-block-3')).toBeUndefined();
		expect(search).toEqual({
			config: 11,
			'arg-val-block-7': '0',
			'test-block-2': '1'
		});
	});
});

describe('/runs/$runId/results/$resultId/measurements', () => {
	const typed = {
		mode: 'overlay',
		selectedCharts: [2, 3]
	} satisfies MeasurementsSearch;

	itRoundTrips({
		to: '/runs/$runId/results/$resultId/measurements',
		params: { runId: 1, resultId: 11 },
		wire: '/runs/1/results/11/measurements?mode=overlay&selectedCharts=2&selectedCharts=3',
		typed
	});

	it('defaults to the default mode with no combined chart', () => {
		expect(measurementsSearch.withDefaults({})).toEqual({
			mode: 'default',
			selectedCharts: []
		});
	});
});

describe('/runs/$runId/issues', () => {
	// Every list is `;`-joined; `sort` is `<id>:asc|desc` or `none`; `cols`
	// is the reader's `+id`/`-id` overrides sorted by id; `open` the row ids
	// whose sub-row is open.
	const typed = {
		page: 2,
		pageSize: 50,
		q: 'foo',
		sort: [{ id: 'title', desc: false }],
		open: { '3': true, '4': true },
		state: ['open'],
		effect: ['fail'],
		categories: ['env', 'flaky'],
		cols: { active: true, tags: false },
		order: ['title', 'state']
	} satisfies RunIssuesSearch;

	itRoundTrips({
		to: '/runs/$runId/issues',
		params: { runId: 1 },
		wire: '/runs/1/issues?page=2&pageSize=50&q=foo&sort=title%3Aasc&open=3%3B4&state=open&effect=fail&categories=env%3Bflaky&cols=%2Bactive%3B-tags&order=title%3Bstate',
		typed
	});

	it('reads sort=none as no sorting and writes it back', async () => {
		const router = await routerAt('/runs/1/issues?sort=none');

		expect(leafSearch(router)).toEqual({ sort: [] });
		expect(
			router.buildLocation({
				to: '/runs/$runId/issues',
				params: { runId: 1 },
				search: { sort: [] }
			}).href
		).toBe(`${config.baseUrl}/runs/1/issues?sort=none`);
	});

	it('writes the column overrides sorted by id, as the table does', async () => {
		const router = await routerAt('/runs/1/issues');

		expect(
			router.buildLocation({
				to: '/runs/$runId/issues',
				params: { runId: 1 },
				search: { cols: { tags: false, active: true } }
			}).href
		).toBe(`${config.baseUrl}/runs/1/issues?cols=%2Bactive%3B-tags`);
	});

	it('a page below 1 or a page size off the menu reads as absent, so the default applies', async () => {
		const router = await routerAt('/runs/1/issues?page=0&pageSize=7');

		expect(leafSearch(router)).toEqual({});
		expect(runIssuesSearch.withDefaults(leafSearch(router))).toMatchObject({
			page: 1,
			pageSize: 25
		});
	});

	it('trims list entries and drops blank ones, as the table decoders do', async () => {
		const router = await routerAt(
			'/runs/1/issues?state=open%3B%20closed%3B&order=title%3B%3B%20state&open=3%3B%20%3B4'
		);

		expect(leafSearch(router)).toEqual({
			state: ['open', 'closed'],
			order: ['title', 'state'],
			open: { '3': true, '4': true }
		});
	});

	it('defaults to page 1 of 25, most results first, nothing open or filtered', () => {
		expect(runIssuesSearch.withDefaults({})).toEqual({
			page: 1,
			pageSize: 25,
			q: '',
			sort: [{ id: 'result_count', desc: true }],
			open: {},
			state: [],
			effect: [],
			categories: []
		});
	});
});

describe('/issues', () => {
	const typed = {
		page: 3,
		state: ['closed'],
		categories: ['test-bug'],
		rules: ['enforced', 'dormant']
	} satisfies IssuesSearch;

	itRoundTrips({
		to: '/issues',
		wire: '/issues?page=3&state=closed&categories=test-bug&rules=enforced%3Bdormant',
		typed
	});

	it('defaults to page 1 of 100, most results first', () => {
		expect(issuesSearch.withDefaults({})).toEqual({
			page: 1,
			pageSize: 100,
			q: '',
			sort: [{ id: 'results', desc: true }],
			open: {},
			state: [],
			categories: [],
			rules: []
		});
	});
});

describe('/issues/rules', () => {
	const typed = {
		issueState: ['open'],
		category: ['env'],
		disposition: ['expected'],
		active: ['true'],
		tags: ['t1'],
		verdicts: ['v1'],
		parameters: ['p=1']
	} satisfies IssueRulesSearch;

	itRoundTrips({
		to: '/issues/rules',
		wire: '/issues/rules?issueState=open&category=env&disposition=expected&active=true&tags=t1&verdicts=v1&parameters=p%3D1',
		typed
	});

	it("defaults to page 1 of 100 in the server's order", () => {
		expect(issueRulesSearch.withDefaults({})).toEqual({
			page: 1,
			pageSize: 100,
			q: '',
			sort: [],
			open: {},
			issueState: [],
			category: [],
			disposition: [],
			active: [],
			tags: [],
			verdicts: [],
			parameters: []
		});
	});
});

describe('/issues/$issueId', () => {
	const typed = { pageSize: 50, category: ['flaky'] } satisfies IssueSearch;

	itRoundTrips({
		to: '/issues/$issueId',
		params: { issueId: '5' },
		wire: '/issues/5?pageSize=50&category=flaky',
		typed
	});

	it('defaults as the rules table does, without the issue state facet', () => {
		expect(issueSearch.withDefaults({})).toEqual({
			page: 1,
			pageSize: 100,
			q: '',
			sort: [],
			open: {},
			category: [],
			disposition: [],
			active: [],
			tags: [],
			verdicts: [],
			parameters: []
		});
	});
});

describe('/issues/$issueId/results', () => {
	const typed = {
		page: 2,
		pageSize: 50,
		columnFilters: {
			'issue-5': [{ id: 'obtained-result', value: { results: ['FAILED'] } }]
		},
		globalRequirements: ['x']
	} satisfies IssueResultsSearch;

	itRoundTrips({
		to: '/issues/$issueId/results',
		params: { issueId: '5' },
		wire:
			`/issues/5/results?page=2&pageSize=50&columnFilters=${lz(
				typed.columnFilters
			)}` + '&globalRequirements=x',
		typed
	});

	it('defaults to page 1 of 25 with no filters', () => {
		expect(issueResultsSearch.withDefaults({})).toEqual({
			page: 1,
			pageSize: 25
		});
	});
});

describe('/compare', () => {
	const typed = {
		left: '1132',
		right: '1151',
		expanded: { '0': true },
		columnVisibility: { total: false }
	} satisfies CompareSearch;

	itRoundTrips({
		to: '/compare',
		wire: '/compare?left=1132&right=1151&expanded=%7B%220%22%3Atrue%7D&columnVisibility=%7B%22total%22%3Afalse%7D',
		typed
	});

	it('defaults to the first row expanded and the total, run and abnormal columns off', () => {
		expect(compareSearch.withDefaults({})).toEqual({
			expanded: { '0': true },
			columnVisibility: {
				TOTAL_LEFT: false,
				TOTAL_RIGHT: false,
				RUN_LEFT: false,
				RUN_RIGHT: false,
				ABNORMAL_LEFT: false,
				ABNORMAL_RIGHT: false
			}
		});
	});
});

describe('/multiple', () => {
	const typed = {
		runIds: ['1132', '1151'],
		selected: '1132',
		isModeFull: true,
		expanded: { '0': true }
	} satisfies MultipleSearch;

	itRoundTrips({
		to: '/multiple',
		wire: '/multiple?runIds=1132&runIds=1151&selected=1132&isModeFull=1&expanded=N4IgDCBcAuBOCuBTAvkA',
		typed
	});

	it('defaults to the compact mode', () => {
		expect(multipleSearch.withDefaults({})).toEqual({ isModeFull: false });
	});
});

describe('/admin/analytics', () => {
	// snake_case keys the page parses itself: the URL is untouched.
	const typed = {
		page: '2',
		page_size: '200',
		event_type: 'page_view;event',
		search: 'foo'
	} satisfies AdminAnalyticsSearch;

	itRoundTrips({
		to: '/admin/analytics',
		wire: '/admin/analytics?page=2&page_size=200&event_type=page_view%3Bevent&search=foo',
		typed
	});

	it('has no read-time defaults', () => {
		expect(adminAnalyticsSearch.withDefaults({})).toEqual({});
	});
});

describe('/admin/import', () => {
	const typed = {
		filters: { status: 'RUNNING' },
		pagination: { pageIndex: 1, pageSize: 25 },
		expanded: { '0': true },
		taskId: 'abc',
		poll: true
	} satisfies ImportSearch;

	itRoundTrips({
		to: '/admin/import',
		wire: '/admin/import?filters=%7B%22status%22%3A%22RUNNING%22%7D&pagination=%7B%22pageIndex%22%3A1%2C%22pageSize%22%3A25%7D&expanded=%7B%220%22%3Atrue%7D&taskId=abc&poll=1',
		typed
	});

	it('defaults to no filter, the first page of 25 and no polling', () => {
		expect(importSearch.withDefaults({})).toEqual({
			filters: {},
			pagination: { pageIndex: 0, pageSize: 25 },
			poll: false
		});
	});
});

describe('/admin/config', () => {
	const typed = {
		configId: 11,
		new_config: { type: 'global', name: 'per_conf' }
	} satisfies ConfigSearch;

	itRoundTrips({
		to: '/admin/config',
		wire: '/admin/config?configId=11&new_config=%7B%22type%22%3A%22global%22%2C%22name%22%3A%22per_conf%22%7D',
		typed
	});

	it('a new_config the schema rejects stays as its raw string through a write', async () => {
		const router = await routerAt(
			'/admin/config?new_config=%7B%22type%22%3A5%7D'
		);

		expect(leafSearch(router)).toEqual({ new_config: '{"type":5}' });

		await router.navigate({
			to: '/admin/config',
			search: (prev: ConfigSearch) => ({ ...prev, _s: 'abc' }),
			replace: true
		});

		expect(router.history.location.href).toBe(
			`${config.baseUrl}/admin/config?new_config=%7B%22type%22%3A5%7D&_s=abc`
		);
	});

	it('an absent new_config reads as the global default', () => {
		expect(configSearch.withDefaults({})).toEqual({
			new_config: { type: 'global', name: 'per_conf' }
		});
	});
});

describe('/tools/packet-viewer', () => {
	const typed = {
		fileUrl: 'https://logs.example.invalid/e2e/run.pcap',
		runId: 1,
		resultId: 1
	} satisfies PacketViewerSearch;

	itRoundTrips({
		to: '/tools/packet-viewer',
		wire: '/tools/packet-viewer?fileUrl=https%3A%2F%2Flogs.example.invalid%2Fe2e%2Frun.pcap&runId=1&resultId=1',
		typed
	});

	it('an invalid fileUrl stays its raw string so the page shows its own error state', async () => {
		const router = await routerAt(
			'/tools/packet-viewer?fileUrl=not-a-url&runId=1'
		);

		expect(leafSearch(router)).toEqual({ fileUrl: 'not-a-url', runId: 1 });
		expect(router.history.location.search).toBe('?fileUrl=not-a-url&runId=1');
		expect(packetViewerSearch.withDefaults({})).toEqual({});
	});

	it('a run id that is not a number stays on the URL through a write', async () => {
		const router = await routerAt(
			'/tools/packet-viewer?fileUrl=https%3A%2F%2Fexample.com%2Fc.pcap&runId=not-a-number'
		);

		await router.navigate({
			to: '/tools/packet-viewer',
			search: (prev: PacketViewerSearch) => ({ ...prev, _s: 'abc' }),
			replace: true
		});

		expect(router.history.location.href).toBe(
			`${config.baseUrl}/tools/packet-viewer?fileUrl=https%3A%2F%2Fexample.com%2Fc.pcap&runId=not-a-number&_s=abc`
		);
	});
});

describe('/auth/login', () => {
	const typed = {
		redirect_url: 'https://bublik.example.invalid/v2/runs?mode=charts'
	} satisfies LoginSearch;

	itRoundTrips({
		to: '/auth/login',
		wire: '/auth/login?redirect_url=https%3A%2F%2Fbublik.example.invalid%2Fv2%2Fruns%3Fmode%3Dcharts',
		typed
	});

	it('has no read-time defaults', () => {
		expect(loginSearch.withDefaults({})).toEqual({});
	});
});
