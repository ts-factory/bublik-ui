/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/**
 * Test fixture: which codec each query key of each page uses today, from the
 * per-page URL contract and the e2e
 * `*_URL_PARAMS` tables. It exists so the corpus round-trip can run every
 * wire value through the codec that will own it. The real route schemas are
 * written in the next ticket and supersede this map.
 */
import {
	bool01,
	boolTrue,
	compressedJson,
	date,
	delimited,
	enumOf,
	json,
	num,
	passthrough,
	repeated,
	repeatedNum,
	str,
	type Codec
} from '../lib/search/codecs';
import type { Shape } from '../lib/search/define-search';

const DELIMITER = ';';

/** Declared on the root route: present on every page. */
const GLOBAL: Shape = {
	project: repeatedNum(),
	_s: str(),
	'hide-sidebar': passthrough(),
	'settings-open': bool01(),
	'settings-tab': enumOf(['account', 'appearance', 'beta', 'preferences'])
};

const CLASSIFICATION: Shape = {
	page: num(),
	pageSize: num(),
	q: str(),
	sort: str(),
	cols: delimited(DELIMITER, { dropEmpty: true }),
	order: delimited(DELIMITER, { dropEmpty: true }),
	open: delimited(DELIMITER, { dropEmpty: true }),
	state: delimited(DELIMITER, { dropEmpty: true }),
	effect: delimited(DELIMITER, { dropEmpty: true }),
	categories: delimited(DELIMITER, { dropEmpty: true }),
	rules: delimited(DELIMITER, { dropEmpty: true }),
	issueState: delimited(DELIMITER, { dropEmpty: true }),
	category: delimited(DELIMITER, { dropEmpty: true }),
	disposition: delimited(DELIMITER, { dropEmpty: true }),
	active: delimited(DELIMITER, { dropEmpty: true }),
	tags: delimited(DELIMITER, { dropEmpty: true }),
	verdicts: delimited(DELIMITER, { dropEmpty: true }),
	parameters: delimited(DELIMITER, { dropEmpty: true })
};

const HISTORY: Shape = {
	testName: str(),
	hash: str(),
	parameters: delimited(DELIMITER),
	revisions: delimited(DELIMITER),
	branches: delimited(DELIMITER),
	labels: delimited(DELIMITER),
	startDate: str(),
	finishDate: str(),
	runData: delimited(DELIMITER),
	runIds: delimited(DELIMITER),
	tagExpr: str(),
	branchExpr: str(),
	labelExpr: str(),
	testArgExpr: str(),
	revisionExpr: str(),
	verdictExpr: str(),
	runProperties: delimited(DELIMITER),
	resultProperties: delimited(DELIMITER),
	results: delimited(DELIMITER),
	verdictLookup: enumOf(['string', 'regex', 'none']),
	verdict: delimited(DELIMITER),
	mode: enumOf([
		'linear',
		'aggregation',
		'measurements',
		'measurements-by-iteration',
		'measurements-combined'
	]),
	page: str(),
	pageSize: str(),
	combinedPlots: delimited(DELIMITER),
	'chart-group': enumOf(['trend', 'measurement']),
	parametersByResultName: repeated(),
	parametersByResultFilter: repeated(),
	fromRun: boolTrue(),
	issue: str(),
	categories: delimited(DELIMITER),
	// Written as `untriaged=`/`explained=` by the form; the history schema reads
	// them as `true` or the empty string.
	untriaged: str(),
	explained: str()
};

const ROUTE_CODECS: [pattern: RegExp, shape: Shape][] = [
	[
		/^\/dashboard$/,
		{
			main: date(),
			secondary: date(),
			mode: enumOf(['rows', 'rows-line', 'columns']),
			search: str(),
			reload: bool01(),
			tv: bool01(),
			dates: str()
		}
	],
	[/^\/history(\/v2)?$/, HISTORY],
	[
		/^\/log\/\$id$/,
		{
			focusId: str(),
			mode: enumOf(['log', 'infoAndlog', 'treeAndinfoAndlog', 'treeAndlog']),
			page: str(),
			lineNumber: str(),
			legacy: boolTrue(),
			experimental: str()
		}
	],
	[
		/^\/runs$/,
		{
			mode: enumOf(['table', 'charts', 'progress']),
			page: str(),
			pageSize: str(),
			calendarMode: enumOf(['default', 'duration']),
			startDate: str(),
			finishDate: str(),
			duration: str(),
			tagExpr: str(),
			runData: delimited(DELIMITER)
		}
	],
	[
		/^\/runs\/\$id$/,
		{
			expanded: compressedJson(),
			sorting: compressedJson(),
			globalFilter: compressedJson(),
			rowState: compressedJson(),
			visibility: compressedJson(),
			columnFilters: compressedJson(),
			columnOrder: json(),
			globalRequirements: repeated(),
			targetIterationId: num(),
			resultFilter: str()
		}
	],
	[
		/^\/runs\/\$id\/report\/?$/,
		{
			config: str(),
			isFullMode: bool01(),
			'selected-records': repeated(),
			'stacked-drawer': bool01()
			// Every other key is a dynamic record filter: passthrough.
		}
	],
	[
		/^\/runs\/\$id\/results\/\$id\/measurements$/,
		{
			mode: enumOf(['default', 'charts', 'tables', 'split', 'overlay']),
			selectedCharts: repeatedNum()
		}
	],
	[/^\/runs\/\$id\/issues$/, CLASSIFICATION],
	[/^\/issues(\/rules|\/\$id)?$/, CLASSIFICATION],
	[
		/^\/compare$/,
		{ left: str(), right: str(), expanded: json(), columnVisibility: json() }
	],
	[
		/^\/multiple$/,
		{ runIds: repeated(), selected: str(), isModeFull: bool01() }
	],
	[/^\/admin\/config$/, { configId: num(), new_config: json() }],
	[/^\/admin\/import$/, { taskId: str(), poll: str() }],
	[
		/^\/admin\/analytics$/,
		{ event_type: passthrough(), page: passthrough(), page_size: passthrough() }
	],
	[
		/^\/tools\/packet-viewer$/,
		{ fileUrl: str(), runId: str(), resultId: str() }
	],
	[/^\/auth\/login$/, { redirect_url: str() }]
];

/** The page each e2e `*_URL_PARAMS` table documents, as `routePattern` spells it. */
const TABLE_ROUTES: Record<string, string> = {
	DASHBOARD_URL_PARAMS: '/dashboard',
	HISTORY_URL_PARAMS: '/history',
	LOG_URL_PARAMS: '/log/$id',
	RUNS_URL_PARAMS: '/runs',
	RUN_URL_PARAMS: '/runs/$id',
	RUN_REPORT_URL_PARAMS: '/runs/$id/report',
	MEASUREMENTS_URL_PARAMS: '/runs/$id/results/$id/measurements',
	RUN_ISSUES_URL_PARAMS: '/runs/$id/issues',
	ISSUES_URL_PARAMS: '/issues',
	ISSUE_RULES_URL_PARAMS: '/issues/rules',
	ISSUE_URL_PARAMS: '/issues/$id',
	RUN_COMPARE_URL_PARAMS: '/compare',
	RUN_MULTIPLE_URL_PARAMS: '/multiple'
};

/** `/v2/runs/12/report` → `/runs/$id/report`. */
function routePattern(pathname: string): string {
	return pathname
		.replace(/^\/v2(?=\/|$)/, '')
		.replace(/\/\d+(?=\/|$)/g, '/$id');
}

/** The codec a key uses on a page, or `undefined` when the fixture has none. */
function codecFor(pathname: string, key: string): Codec<unknown> | undefined {
	const pattern = routePattern(pathname);
	const route = ROUTE_CODECS.find(([regex]) => regex.test(pattern))?.[1];

	return route?.[key] ?? GLOBAL[key];
}

export { codecFor, GLOBAL, ROUTE_CODECS, routePattern, TABLE_ROUTES };
