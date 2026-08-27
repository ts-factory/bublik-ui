/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET Labs Ltd. */

export type IssueCategory =
	| 'product-defect'
	| 'test-bug'
	| 'env'
	| 'known-issue'
	| 'flaky'
	| 'to-investigate';

export type IssueState = 'open' | 'closed';

export type IssueExt = {
	id: number;
	key: string;
	status: string | null;
	title: string | null;
	synced_at: string | null;
};

export type Issue = {
	id: number;
	title: string;
	description: string | null;
	state: IssueState;
	issue_ext: IssueExt | null;
	created_at: string;
	updated_at: string;
	closed_at: string | null;
	/**
	 * Everything below is what the issues list needs to be triaged from, and
	 * none of it is on `/issues/` yet — `/runs/{id}/issues/` already returns the
	 * same shape, so this is the contract the list endpoint is growing towards.
	 *
	 * Optional on purpose: `IssuesTable` reads each field when it arrives and
	 * falls back to joining `/issue_rules/` client-side until then. Dropping the
	 * optionality is the signal that the fallback can go.
	 */
	/** TODO(api): resolve like `run_issues_summary` does, via `resolve_ref`. */
	bug_url?: string | null;
	/** TODO(api): distinct categories across the issue's rules. */
	categories?: IssueCategory[];
	/** TODO(api): total rules on the issue, in the requested project. */
	rule_count?: number;
	/** TODO(api): of those, how many are active. */
	active_rule_count?: number;
	/** TODO(api): distinct results stamped under this issue. */
	result_count?: number;
};

/** DRF's list envelope — `bublik/core/pagination.py`. */
export interface PaginatedResponse<T> {
	pagination: { count: number; next: string | null; previous: string | null };
	results: T[];
}

/**
 * Facet counts computed over the whole filtered set rather than the current
 * page. Once paging moves server-side the page cannot answer "how many closed
 * issues are there", and a facet labelled with a page-local count is worse than
 * one with no count at all.
 *
 * TODO(api): `GET /issues/facets`.
 */
export interface IssueFacets {
	state: Record<string, number>;
	categories: Record<string, number>;
	rules: Record<string, number>;
}

export type IssueRule = {
	id: number;
	project: number;
	issue: number;
	category: IssueCategory;
	expected: boolean | null;
	active: boolean;
	test: number;
	test_name: string;
	match_parameters: boolean;
	match_verdicts: boolean;
	match_important_tags: boolean;
	match_all_tags: boolean;
	parameters: Record<string, string>;
	verdicts: string[];
	tags: string[];
};

export type RuleResultOrigin = 'import' | 'manual_persistent' | 'manual_oneoff';

/** Per-result classification badge data (embedded in run result rows). */
export type ResultIssueRef = {
	issue_id: number;
	issue_title: string;
	issue_state: IssueState;
	/** External bug key (e.g. ISSUE-240); populated in history rows. */
	bug_key?: string | null;
	category: IssueCategory;
	expected: boolean | null;
	rule_id: number;
	origin: RuleResultOrigin;
};

export interface RunIssueRow {
	issue_id: number;
	title: string;
	state: IssueState;
	/** External tracker key, e.g. `ref://JIRA/FOO-123`. */
	bug_key: string | null;
	/** Resolved tracker URL for `bug_key`, when the project can resolve it. */
	bug_url: string | null;
	/** Distinct results in this run stamped under this issue. */
	result_count: number;
	categories: { category: IssueCategory; expected: boolean | null }[];
}

export interface RunIssueResultRow {
	result_id: number;
	/** Test name. The run tree folds this into `path`; here it stays separate. */
	name: string | null;
	/** Package chain only, top-down — the test's own name is **not** included. */
	path: string[];
	obtained_result: string | null;
	verdicts: string[];
}

/**
 * The same row seen from the issue rather than from one run, so it has to say
 * which run each result came from.
 *
 * TODO(api): `GET /issues/{id}/results`.
 */
export interface IssueResultRow extends RunIssueResultRow {
	run_id: number;
}

export interface IssuePickerOption {
	id: number;
	title: string;
	key: string | null;
	category: IssueCategory | null;
}

export type ClassifyScope = 'future' | 'oneoff';

export interface ClassifyMatcher {
	matchParameters: boolean;
	matchVerdicts: boolean;
	matchImportantTags: boolean;
	matchAllTags: boolean;
}

export type ClassifyRequest = {
	resultId: number;
	projectId: number;
	issue: number | { title: string; description?: string; bug_key?: string };
	category: IssueCategory;
	expected?: boolean | null;
	scope: ClassifyScope;
	// Optional; keys are decamelized to match_* by prepareForSend. Omit to keep
	// the backend defaults (path + params + verdicts + important tags).
	matcher?: ClassifyMatcher;
};
