/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { config } from './environment';

/**
 * Sections of the user guide the UI links to. They live in the docs site, a
 * separate repo (`bublik-release`, `docs/user-guide/`), and its broken-link
 * check cannot see these, so keep them in step with its pages and heading ids.
 */
export const USER_GUIDE = {
	index: 'user-guide',
	runsList: 'user-guide/runs#list',
	runsCharts: 'user-guide/runs#charts',
	runsTable: 'user-guide/runs#table',
	runsMultiple: 'user-guide/runs#multiple',
	runsCompare: 'user-guide/runs#compare',
	run: 'user-guide/run',
	runDetails: 'user-guide/run#details',
	runTable: 'user-guide/run#run-table',
	runReport: 'user-guide/run#report',
	runIssues: 'user-guide/run#issues',
	historyList: 'user-guide/history#list',
	historyGroups: 'user-guide/history#groups',
	historyTrendCharts: 'user-guide/history#trend-charts',
	historySeriesCharts: 'user-guide/history#series-charts',
	historyStackedCharts: 'user-guide/history#stacked-charts',
	result: 'user-guide/result',
	resultChartsTables: 'user-guide/result#charts-tables',
	resultSplit: 'user-guide/result#split',
	resultTables: 'user-guide/result#tables',
	resultStacked: 'user-guide/result#stacked'
} as const;

/** The docs site is served next to the app, under the same URL prefix. */
export function docsUrl(path?: string): string {
	const root = `${config.oldBaseUrl}/docs`;

	return path ? `${root}/${path}` : root;
}
