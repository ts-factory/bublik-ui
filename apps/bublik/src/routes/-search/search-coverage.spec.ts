/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import type { SearchSchema, Shape } from '@/router';

import { compareSearch } from './compare.search';
import { dashboardSearch } from './dashboard.search';
import { historySearch } from './history.search';
import { issueResultsSearch } from './issue-results.search';
import { issueRulesSearch } from './issue-rules.search';
import { issueSearch } from './issue.search';
import { issuesSearch } from './issues.search';
import { logSearch } from './log.search';
import { measurementsSearch } from './measurements.search';
import { multipleSearch } from './multiple.search';
import { rootSearch } from './root.search';
import { runIssuesSearch } from './run-issues.search';
import { runReportSearch } from './run-report.search';
import { runSearch } from './run.search';
import { runsSearch } from './runs.search';

/**
 * The e2e page objects document every query key of every page in a
 * `*_URL_PARAMS` table (the regression oracle of the migration). Each key
 * must be declared by that page's schema or by the root schema, so a key the
 * suite starts pinning cannot stay untyped.
 */
const SCHEMA_OF_TABLE: Record<string, SearchSchema<Shape>> = {
	DASHBOARD_URL_PARAMS: dashboardSearch,
	HISTORY_URL_PARAMS: historySearch,
	LOG_URL_PARAMS: logSearch,
	RUNS_URL_PARAMS: runsSearch,
	RUN_URL_PARAMS: runSearch,
	RUN_REPORT_URL_PARAMS: runReportSearch,
	MEASUREMENTS_URL_PARAMS: measurementsSearch,
	RUN_ISSUES_URL_PARAMS: runIssuesSearch,
	ISSUES_URL_PARAMS: issuesSearch,
	ISSUE_RULES_URL_PARAMS: issueRulesSearch,
	ISSUE_URL_PARAMS: issueSearch,
	ISSUE_RESULTS_URL_PARAMS: issueResultsSearch,
	RUN_COMPARE_URL_PARAMS: compareSearch,
	RUN_MULTIPLE_URL_PARAMS: multipleSearch
};

const pageObjects = import.meta.glob<Record<string, unknown>>(
	'../../../e2e/pages/*.ts',
	{ eager: true }
);

function tables(): [name: string, keys: string[]][] {
	return Object.values(pageObjects).flatMap((mod) =>
		Object.entries(mod)
			// `RUN_COMPRESSED_URL_PARAMS` is a list of keys, not a table.
			.filter(
				([name, table]) =>
					name.endsWith('_URL_PARAMS') && table && !Array.isArray(table)
			)
			.map(([name, table]): [string, string[]] => [
				name,
				Object.keys(table as object)
			])
	);
}

describe('every e2e *_URL_PARAMS table', () => {
	const found = tables();

	// A page may be documented by two page objects (the classification pages'
	// behaviour and URL-contract suites); each table is checked below.
	it('is mapped to a schema', () => {
		expect([...new Set(found.map(([name]) => name))].sort()).toEqual(
			Object.keys(SCHEMA_OF_TABLE).sort()
		);
	});

	it.each(found)(
		'%s: every key is declared by the page or root schema',
		(name, keys) => {
			const declared = new Set([
				...Object.keys(rootSearch.shape),
				...Object.keys(SCHEMA_OF_TABLE[name].shape)
			]);

			expect(keys.filter((key) => !declared.has(key))).toEqual([]);
		}
	);
});
