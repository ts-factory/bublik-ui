/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { VisibilityState } from '@tanstack/react-table';

export const COLUMN_ID = {
	STATUS: 'status',
	/**
	 * **Not** `'project'`. A column id is also its URL key
	 * (`useClassificationTableState`), and `project` is taken: it is
	 * `PROJECT_KEY`, the multi-valued param the global project selector owns and
	 * `useProjectSearch` reads as a list of ids. Writing a project *name* there
	 * made every request send `project=NaN`.
	 */
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
	PARAMETERS: 'parameters'
} as const;

/**
 * Every column on but one.
 *
 * The matcher's three criteria — tags, verdicts, parameters — used to be hidden
 * and reachable only by expanding one row at a time. But a rule *is* its
 * matcher: hiding it left the list saying which test a rule was about and
 * nothing about what it actually matches. They are columns now, ordered widest
 * gate first: tags decide whether the run is considered at all, verdicts narrow
 * to a failure mode, parameters to one iteration.
 *
 * Fitting them is the track list's problem, not this one's — see
 * `ISSUE_COLUMN` for how the width is shared out. The columns menu is there
 * for anyone who wants a narrower list than the default.
 *
 * `Rule` is the exception, and off by default. The status stripe at the row's
 * leading edge already answers the question the badge answers — it stripes on
 * `issueRulesState` over a set of one, so a rule the issue deactivated reads
 * differently from one in force — and the badge repeated it a column later.
 * The toolbar's Rule facet is untouched: filtering is URL state, not column
 * visibility, so an `active` filter still narrows the list with the column off,
 * and the columns menu brings the badge back.
 */
export const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
	[COLUMN_ID.ACTIVE]: false
};

/** Module-level so the URL-state hook's memos do not churn every render. */
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

/**
 * Keyed by mode, not by the component. These are two different pages — the
 * project's whole rule list and one issue's rules — and they do not even show
 * the same columns, since Issue is meaningless once every row shares one.
 * Sharing a key meant hiding a column on one hid it on the other.
 *
 * `-v2` because the stored value outlives the default: everyone who has used
 * this page before has `{tags, verdicts, parameters} = false` in local storage,
 * and would go on seeing the old three-column-short list forever.
 */
export const COLUMN_VISIBILITY_KEY = {
	ALL_RULES: 'issue-rules-all-v2',
	ONE_ISSUE: 'issue-rules-v2'
} as const;

/** Same reasoning as the issues list: rules are read as a set. */
export const DEFAULT_PAGE_SIZE = 100;
