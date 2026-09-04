/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { VisibilityState } from '@tanstack/react-table';

/**
 * Ordered so the row reads as a sentence: *which* issue — its tracker key, then
 * its title — *how much* of the run it accounts for, whether it is still open,
 * *what it does* to the unexpected count, and only then the cause behind that.
 *
 * State sits that early because it outranks everything after it: closing an
 * issue deactivates its rules and un-suppresses every result they were hiding.
 * Effect On Run already accounts for that — it reads "counting again" on a
 * closed issue whose rules would otherwise suppress.
 */
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

export const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {};

/** The `bublik.columns.*` localStorage slot this table's choices persist in. */
export const COLUMN_VISIBILITY_KEY = 'run-issues';

/** Module-level so the URL-state hook's memos do not churn every render. */
export const FILTER_KEYS = [
	COLUMN_ID.STATE,
	COLUMN_ID.EFFECT,
	COLUMN_ID.CATEGORIES
] as const;
