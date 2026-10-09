/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { VisibilityState } from '@tanstack/react-table';

import { DEFAULT_PAGE_SIZE } from '../classification-table/classification-table.constants';
import { defineClassificationSearch } from '../classification-table/classification-table.search';

export const COLUMN_ID = {
	STATUS: 'status',
	ACTIONS: 'actions',
	BUG_KEY: 'bug_key',
	ISSUE: 'issue',
	DESCRIPTION: 'description',
	RESULTS: 'result_count',
	STATE: 'state',
	EFFECT: 'effect',
	CATEGORIES: 'categories'
} as const;

/**
 * The columns a reader can drag, left to right. The stripe is pinned first and
 * Actions last (`PINNED_COLUMNS`), as in the global issues table.
 */
export const DEFAULT_COLUMN_ORDER = [
	COLUMN_ID.STATUS,
	COLUMN_ID.BUG_KEY,
	COLUMN_ID.STATE,
	COLUMN_ID.CATEGORIES,
	COLUMN_ID.RESULTS,
	COLUMN_ID.EFFECT,
	COLUMN_ID.ISSUE,
	COLUMN_ID.DESCRIPTION,
	COLUMN_ID.ACTIONS
] as const;

export const PINNED_COLUMNS = {
	first: [COLUMN_ID.STATUS],
	last: [COLUMN_ID.ACTIONS]
} as const;

/**
 * Effect On Run starts hidden: the stripe already carries it, in colour, and
 * its toolbar filter keeps working either way.
 */
export const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
	[COLUMN_ID.EFFECT]: false
};

export const COLUMN_VISIBILITY_KEY = 'run-issues';

export const FILTER_KEYS = [
	COLUMN_ID.STATE,
	COLUMN_ID.EFFECT,
	COLUMN_ID.CATEGORIES
] as const;

/**
 * `/runs/$runId/issues`: the route's search and what the table
 * reads and writes, with 25 rows a page, most results first, as the
 * defaults.
 */
export const RUN_ISSUES_TABLE_SEARCH = defineClassificationSearch({
	facets: FILTER_KEYS,
	pageSize: DEFAULT_PAGE_SIZE,
	sort: [{ id: COLUMN_ID.RESULTS, desc: true }]
});
