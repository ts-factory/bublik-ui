/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { VisibilityState } from '@tanstack/react-table';

export const COLUMN_ID = {
	STATUS: 'status',
	PROJECT: 'rule_project',
	ACTIONS: 'actions',
	KEY: 'key',
	ISSUE: 'issue',
	ISSUE_STATE: 'issueState',
	TEST: 'test',
	CATEGORY: 'category',
	DISPOSITION: 'disposition',
	SCOPE: 'scope',
	ACTIVE: 'active',
	TAGS: 'tags',
	VERDICTS: 'verdicts',
	PARAMETERS: 'parameters',
	EXPANDER: 'expander'
} as const;

const BADGE_TRACK = 'auto';

/**
 * Grid tracks, one per column.
 *
 * Every track is capped, and the table renders with a gutter, just before
 * Actions, that takes whatever is left. That is what keeps the columns packed
 * to the left with Actions on the right edge: a badge
 * column is exactly as wide as its widest badge, Issue and Match Scope are
 * sized to their widest row (`max-content`) rather than to a guess that is
 * wrong in both directions, and the surplus lands in the empty track on the
 * right instead of being spread across columns that did not ask for it. A
 * track that could grow without limit would swallow whatever the hidden
 * columns left behind, which is how Issue used to stretch across a third of
 * the screen as soon as Tags, Verdicts and Parameters were switched off.
 */
export const COLUMN_WIDTH: Record<string, string> = {
	[COLUMN_ID.ACTIVE]: BADGE_TRACK,
	[COLUMN_ID.DISPOSITION]: BADGE_TRACK,
	[COLUMN_ID.KEY]: BADGE_TRACK,
	[COLUMN_ID.ISSUE]: 'minmax(12rem, max-content)',
	[COLUMN_ID.ISSUE_STATE]: BADGE_TRACK,
	[COLUMN_ID.CATEGORY]: BADGE_TRACK,
	[COLUMN_ID.TEST]: 'minmax(9rem, max-content)',
	[COLUMN_ID.SCOPE]: 'minmax(7rem, max-content)',
	[COLUMN_ID.TAGS]: 'minmax(9rem, 20rem)',
	[COLUMN_ID.VERDICTS]: 'minmax(12rem, 28rem)',
	[COLUMN_ID.PARAMETERS]: 'minmax(12rem, 28rem)'
};

/**
 * The columns a reader can drag, left to right, for each view. The stripe and
 * the expander are pinned first and Actions last (`PINNED_COLUMNS`), and the
 * project column never shows — it exists so the table can group by it.
 */
export const DEFAULT_COLUMN_ORDER = {
	ALL_RULES: [
		COLUMN_ID.STATUS,
		COLUMN_ID.EXPANDER,
		COLUMN_ID.KEY,
		COLUMN_ID.ISSUE,
		COLUMN_ID.ISSUE_STATE,
		COLUMN_ID.ACTIVE,
		COLUMN_ID.CATEGORY,
		COLUMN_ID.TEST,
		COLUMN_ID.SCOPE,
		COLUMN_ID.TAGS,
		COLUMN_ID.VERDICTS,
		COLUMN_ID.PARAMETERS,
		COLUMN_ID.DISPOSITION,
		COLUMN_ID.ACTIONS
	],
	ONE_ISSUE: [
		COLUMN_ID.STATUS,
		COLUMN_ID.EXPANDER,
		COLUMN_ID.ACTIVE,
		COLUMN_ID.CATEGORY,
		COLUMN_ID.TEST,
		COLUMN_ID.SCOPE,
		COLUMN_ID.TAGS,
		COLUMN_ID.VERDICTS,
		COLUMN_ID.PARAMETERS,
		COLUMN_ID.DISPOSITION,
		COLUMN_ID.ACTIONS
	]
} as const;

export const PINNED_COLUMNS = {
	first: [COLUMN_ID.STATUS, COLUMN_ID.EXPANDER],
	last: [COLUMN_ID.ACTIONS]
} as const;

/**
 * The matcher columns start hidden.
 *
 * They are the widest thing the table can show and the least often read: what a
 * rule matches on is a detail you go looking for on one rule, not something you
 * scan a page of rules for. The Match Scope chips already say *which* criteria
 * a rule gates on, and the row detail panel spells out their values, so nothing
 * is unreachable — the column visibility control brings them back, and the
 * choice is remembered per table.
 *
 * Disposition starts hidden too: the stripe carries it now, in colour. The
 * column stays for anyone who wants it spelled out, and its filter keeps
 * working either way. Project never shows; it is the grouping column.
 */
export const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
	[COLUMN_ID.PROJECT]: false,
	[COLUMN_ID.DISPOSITION]: false,
	[COLUMN_ID.TAGS]: false,
	[COLUMN_ID.VERDICTS]: false,
	[COLUMN_ID.PARAMETERS]: false
};

/**
 * The columns that fold into the row detail panel when the table is compact,
 * in the order they appear there.
 */
export const DETAIL_COLUMN_IDS: string[] = [
	COLUMN_ID.SCOPE,
	COLUMN_ID.TAGS,
	COLUMN_ID.VERDICTS,
	COLUMN_ID.PARAMETERS
];

/** What `DEFAULT_COLUMN_VISIBILITY` becomes once the table runs out of room. */
export const COMPACT_COLUMN_VISIBILITY: VisibilityState = {
	...DEFAULT_COLUMN_VISIBILITY,
	...Object.fromEntries(DETAIL_COLUMN_IDS.map((id) => [id, false]))
};

/**
 * Roughly the sum of the column minimums for each view — below it the grid
 * overflows and the wide columns would scroll off-screen unreachably, so they
 * fold into the detail panel instead. The all-rules view needs more room
 * because it also carries Key, Issue and State.
 *
 * Measured against the *default* visible set, which includes Test (`9rem`)
 * but not the three matcher columns (`12rem` + `12rem` + `9rem`). Held
 * above the bare minimum so that turning a matcher column back on still folds
 * on a genuinely narrow window rather than overflowing.
 */
export const COMPACT_WIDTH_PX = {
	ALL_RULES: 1000,
	ONE_ISSUE: 700
} as const;

export const FILTER_KEYS = [
	COLUMN_ID.ISSUE_STATE,
	COLUMN_ID.CATEGORY,
	COLUMN_ID.DISPOSITION,
	COLUMN_ID.ACTIVE,
	COLUMN_ID.TAGS,
	COLUMN_ID.VERDICTS,
	COLUMN_ID.PARAMETERS
] as const;

/** The free-text filters, kept in the URL as one param per value. */
export const REPEATED_FILTER_KEYS = [
	COLUMN_ID.TAGS,
	COLUMN_ID.VERDICTS,
	COLUMN_ID.PARAMETERS
] as const;

/**
 * The columns DRF's `OrderingFilter` can actually sort, and the field name it
 * knows each by.
 */
export const ORDERING_BY_COLUMN_ID: Record<string, string | null> = {
	[COLUMN_ID.ISSUE]: 'issue_title',
	[COLUMN_ID.TEST]: 'test_name',
	[COLUMN_ID.CATEGORY]: 'category',
	[COLUMN_ID.ACTIVE]: 'active'
};

export const ACTIVE_ORDER = ['true', 'false'] as const;

export type ActiveKey = (typeof ACTIVE_ORDER)[number];

/**
 * Bumped from `-v2`: the stored diff could hide Active, which the stripe no
 * longer stands in for, and knew nothing of Disposition starting hidden.
 */
export const COLUMN_VISIBILITY_KEY = {
	ALL_RULES: 'issue-rules-all-v3',
	ONE_ISSUE: 'issue-rules-v3'
} as const;

export const DEFAULT_PAGE_SIZE = 100;
