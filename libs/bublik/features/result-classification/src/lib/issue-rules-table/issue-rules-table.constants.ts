/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { VisibilityState } from '@tanstack/react-table';

export const COLUMN_ID = {
	STATUS: 'status',
	PROJECT: 'rule_project',
	ACTIONS: 'actions',
	TEST: 'test',
	KEY: 'key',
	ISSUE: 'issue',
	ISSUE_STATE: 'issueState',
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
 * Every track is capped — none of them ends in `fr`. A column that could grow
 * without limit would swallow whatever the hidden columns left behind, which is
 * how Test and Issue used to stretch across a third of the screen each as soon
 * as Tags, Verdicts and Parameters were switched off. The surplus goes to the
 * table's end gutter instead, so a column occupies the same place no matter
 * which of its neighbours are on.
 */
export const COLUMN_WIDTH: Record<string, string> = {
	[COLUMN_ID.PROJECT]: BADGE_TRACK,
	[COLUMN_ID.TEST]: 'minmax(9rem, 18rem)',
	[COLUMN_ID.ACTIVE]: BADGE_TRACK,
	[COLUMN_ID.DISPOSITION]: BADGE_TRACK,
	[COLUMN_ID.KEY]: BADGE_TRACK,
	[COLUMN_ID.ISSUE]: 'minmax(12rem, 26rem)',
	[COLUMN_ID.ISSUE_STATE]: BADGE_TRACK,
	[COLUMN_ID.CATEGORY]: BADGE_TRACK,
	[COLUMN_ID.SCOPE]: 'minmax(7rem, 9rem)',
	[COLUMN_ID.TAGS]: 'minmax(9rem, 16rem)',
	[COLUMN_ID.VERDICTS]: 'minmax(12rem, 22rem)',
	[COLUMN_ID.PARAMETERS]: 'minmax(12rem, 22rem)'
};

export const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
	[COLUMN_ID.ACTIVE]: false
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
 */
export const COMPACT_WIDTH_PX = {
	ALL_RULES: 1400,
	ONE_ISSUE: 1120
} as const;

export const FILTER_KEYS = [
	COLUMN_ID.PROJECT,
	COLUMN_ID.ISSUE_STATE,
	COLUMN_ID.CATEGORY,
	COLUMN_ID.DISPOSITION,
	COLUMN_ID.ACTIVE,
	COLUMN_ID.TAGS,
	COLUMN_ID.VERDICTS,
	COLUMN_ID.PARAMETERS
] as const;

export const ACTIVE_ORDER = ['true', 'false'] as const;

export type ActiveKey = (typeof ACTIVE_ORDER)[number];

export const COLUMN_VISIBILITY_KEY = {
	ALL_RULES: 'issue-rules-all-v2',
	ONE_ISSUE: 'issue-rules-v2'
} as const;

export const DEFAULT_PAGE_SIZE = 100;
