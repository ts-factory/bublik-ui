/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { VisibilityState } from '@tanstack/react-table';

export const COLUMN_ID = {
	STATUS: 'status',
	ACTIONS: 'actions',
	KEY: 'key',
	ISSUE: 'issue',
	DESCRIPTION: 'description',
	CREATED: 'created',
	STATE: 'state',
	PROJECT: 'issue_project',
	CATEGORIES: 'categories',
	RULES: 'rules',
	RESULTS: 'results'
} as const;

/**
 * The columns DRF's `OrderingFilter` can actually sort, and the field name it
 * knows each by. Anything absent orders by its own id; `IssueViewSet` takes
 * `created_at`, `updated_at`, `title` and `state`.
 */
export const ORDERING_BY_COLUMN_ID: Record<string, string | null> = {
	[COLUMN_ID.ISSUE]: 'title',
	[COLUMN_ID.CREATED]: 'created_at',
	[COLUMN_ID.STATE]: 'state'
};

/**
 * The columns a reader can drag, left to right. The stripe is pinned first and
 * Actions last (`PINNED_COLUMNS`); the project column never shows — it exists
 * so the table can group by it.
 */
export const DEFAULT_COLUMN_ORDER = [
	COLUMN_ID.STATUS,
	COLUMN_ID.KEY,
	COLUMN_ID.STATE,
	COLUMN_ID.CATEGORIES,
	COLUMN_ID.RULES,
	COLUMN_ID.RESULTS,
	COLUMN_ID.CREATED,
	COLUMN_ID.ISSUE,
	COLUMN_ID.DESCRIPTION,
	COLUMN_ID.ACTIONS
] as const;

export const PINNED_COLUMNS = {
	first: [COLUMN_ID.STATUS],
	last: [COLUMN_ID.ACTIONS]
} as const;

export const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
	[COLUMN_ID.PROJECT]: false,
	[COLUMN_ID.CREATED]: false
};

/** Bumped: the stored diff predates Description showing by default. */
export const COLUMN_VISIBILITY_KEY = 'issues-v2';

export const FILTER_KEYS = [
	COLUMN_ID.STATE,
	COLUMN_ID.CATEGORIES,
	COLUMN_ID.RULES
] as const;

export const DEFAULT_PAGE_SIZE = 100;
