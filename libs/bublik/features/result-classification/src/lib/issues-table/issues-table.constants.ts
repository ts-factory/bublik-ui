/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { VisibilityState } from '@tanstack/react-table';

/**
 * Actions lead, the way they do on the run's result table: the controls sit
 * where the eye already starts rather than at the far edge of a wide row.
 *
 * Then identity — key, title, when it appeared — and then the columns that
 * describe it, in the sequence the run's issue table uses for the ones they
 * share, so moving between `/issues` and `/runs/:runId/issues` does not mean
 * re-finding every column. `State` earns its place before the rest because
 * closing an issue deactivates every rule under it, silently overriding the
 * columns that follow; `Rules` sits next to it because they are one mechanism.
 */
export const COLUMN_ID = {
	STATUS: 'status',
	ACTIONS: 'actions',
	KEY: 'key',
	ISSUE: 'issue',
	DESCRIPTION: 'description',
	CREATED: 'created',
	STATE: 'state',
	/**
	 * **Not** `'project'`. A column id is also its URL key
	 * (`useClassificationTableState`), and `project` belongs to the global
	 * project selector, which reads it as a list of ids — a project *name*
	 * written there made every request send `project=NaN`. Same trap, and the
	 * same workaround, as `rule_project` on the rules table.
	 */
	PROJECT: 'issue_project',
	CATEGORIES: 'categories',
	RULES: 'rules'
} as const;

/**
 * `Created` off by default.
 *
 * It is the one column here nobody triages by — a stamp on the issue rather
 * than something that says what to do about it — and on a row already carrying
 * nine other columns it is a track spent on metadata. The sort it feeds is
 * unaffected: the default ordering lives in the URL state, not in the header,
 * so the list is still newest-first with the column off. The columns menu
 * brings it back for anyone who wants the date in the row.
 */
export const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
	[COLUMN_ID.CREATED]: false
};

/** The `bublik.columns.*` localStorage slot this table's choices persist in. */
export const COLUMN_VISIBILITY_KEY = 'issues';

/** Module-level so the URL-state hook's memos do not churn every render. */
export const FILTER_KEYS = [
	COLUMN_ID.STATE,
	COLUMN_ID.PROJECT,
	COLUMN_ID.CATEGORIES,
	COLUMN_ID.RULES
] as const;

/**
 * Triage means scanning the whole list, not paging through it. The server caps
 * `page_size` at 10000, so 100 is well inside what it will serve.
 */
export const DEFAULT_PAGE_SIZE = 100;
