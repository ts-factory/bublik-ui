/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET Labs Ltd. */
import type { RunDataResults } from './run';

export type IssueCategory =
	| 'product-defect'
	| 'test-bug'
	| 'env'
	| 'known-issue'
	| 'flaky'
	| 'to-investigate';

export type IssueState = 'open' | 'closed';

/**
 * What a rule's `expected` disposition does to the results it stamps, given the
 * issue's state — computed server-side by `effect_for()` so every listing agrees:
 * `suppressed` (expected, issue open), `stale` (issue closed), `unexpected`
 * (expected is false), `marked` (a marker only, expected is null).
 */
export type RuleEffect = 'suppressed' | 'stale' | 'unexpected' | 'marked';

/**
 * One rule as summarised on an issue. An issue carries no classification of its
 * own — category and disposition live on its rules. `/issues/` lists the issue's
 * *active* rules; `/runs/{id}/issues/` lists the rules that stamped something in
 * that run, active or not.
 */
export interface IssueRuleRef {
	rule_id: number;
	category: IssueCategory;
	expected: boolean | null;
	effect: RuleEffect;
}

/** `rules_state_for()`: how an issue's rules stand, as one value. */
export type IssueRulesState =
	| 'enforced'
	| 'dormant'
	| 'deactivated'
	| 'unruled';

export type Issue = {
	id: number;
	project: number;
	title: string;
	description: string | null;
	state: IssueState;
	/**
	 * External bug reference in `ref://TRACKER/KEY` form, or null when unlinked.
	 * There is no tracker-cache row behind it: the key *is* the reference.
	 */
	bug_key: string | null;
	/** `bug_key` resolved against the project's tracker config, or null. */
	bug_url: string | null;
	project_name: string;
	/** The issue's active rules. */
	rules: IssueRuleRef[];
	rule_count: number;
	active_rule_count: number;
	/**
	 * Stamps across all of the issue's rules — a result stamped by two rules
	 * counts twice. Annotated on list and retrieve only: a freshly created issue
	 * answers 0 until the list refetches.
	 */
	result_count: number;
	rules_state: IssueRulesState;
	created_at: string;
	created_by_name: string | null;
	updated_at: string;
	updated_by_name: string | null;
	closed_at: string | null;
	closed_by_name: string | null;
};

/** DRF's list envelope — `bublik/core/pagination.py`. */
export interface PaginatedResponse<T> {
	pagination: { count: number; next: string | null; previous: string | null };
	results: T[];
}

/**
 * Every value each result-table filter can take over an issue's results,
 * unfiltered — `/issues/<id>/results/facets/` — so the filter bar can offer
 * what the other pages hold.
 */
export interface IssueResultsFacets {
	results: string[];
	result_properties: string[];
	verdicts: string[];
	categories: string[];
	classifications: string[];
	artifacts: string[];
	parameters: string[];
	requirements: string[];
}

export interface IssueResultsResponse {
	pagination: {
		page: number;
		count: number;
		next: string | null;
		previous: string | null;
	};
	results: RunDataResults[];
}

/**
 * The summary every bulk action returns — `close`/`reopen` on issues,
 * `activate`/`deactivate` on rules. `unchanged` counts rows that were already in
 * the requested state, which is why "nothing happened" is a success, not an
 * error.
 */
export interface BulkActionResult {
	requested: number;
	updated: number;
	unchanged: number;
	not_found: number;
}

/**
 * Facet counts over the whole filtered set rather than the current page — a
 * page cannot answer "how many closed issues are there". Each dimension is
 * counted with its own filter removed and every other one applied, so a
 * facet's options keep their counts while that facet is being picked from.
 */
export interface IssueFacets {
	state: Record<string, number>;
	/** Distinct issues with an *active* rule in each category. */
	categories: Record<string, number>;
	rules: Record<string, number>;
	/** Keyed by project id, as a string. */
	project: Record<string, number>;
}

/** `/issue_rules/facets/`. Note `category`, where issues say `categories`. */
export interface IssueRuleFacets {
	active: Record<string, number>;
	category: Record<string, number>;
	/** Keyed `expected` / `unexpected` / `none`, as the filter takes them. */
	expected: Record<string, number>;
	project: Record<string, number>;
	issue_state?: Record<string, number>;
	/** Rules per captured tag, keyed as captured. */
	tag?: Record<string, number>;
	verdict?: Record<string, number>;
	/** Rules per captured parameter, keyed `name=value`. */
	parameter?: Record<string, number>;
}

export type IssueRule = {
	id: number;
	/** Read through `issue.project_id`; a rule has no project of its own. */
	project: number;
	issue: number;
	/**
	 * Read through the linked issue, so a rules list needs no join to name the
	 * issue it belongs to or to link out to the tracker.
	 */
	issue_title: string;
	issue_state: IssueState;
	project_name: string;
	bug_key: string | null;
	bug_url: string | null;
	category: IssueCategory;
	expected: boolean | null;
	active: boolean;
	test: number;
	test_name: string;
	/** `/`-joined package path, including the test itself. */
	test_path: string;
	/**
	 * The matcher. The parameters and tags are matched as a subset of the
	 * failure's and the run's, and an empty one is *ignored*. The verdicts are
	 * matched exactly, in order: null ignores them, and `[]` matches only a
	 * failure without any. A stored rule's "match scope" is the set of these
	 * three that are not ignored. See `chipsForRule`.
	 */
	parameters: Record<string, string>;
	verdicts: string[] | null;
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
	/** Resolved tracker URL for `bug_key`, when the project can resolve it. */
	bug_url?: string | null;
	category: IssueCategory;
	expected: boolean | null;
	rule_id: number;
	origin: RuleResultOrigin;
};

export interface RunIssueRow {
	issue_id: number;
	title: string;
	description: string | null;
	state: IssueState;
	/** External tracker key, e.g. `ref://JIRA/FOO-123`. */
	bug_key: string | null;
	/** Resolved tracker URL for `bug_key`, when the project can resolve it. */
	bug_url: string | null;
	/** Distinct results in this run stamped under this issue. */
	result_count: number;
	/** The rules that stamped something in this run, active or not. */
	rules: IssueRuleRef[];
}

/**
 * Both classified-result listings — `/runs/{id}/issues/{issueId}/results/` and
 * `/results/?issue={id}` — go through `generate_results_details`, so a row is a
 * `RunDataResults` and carries its own `run_id`. They answer with a
 * `{ results: [...] }` envelope rather than a bare array, and each row
 * carries the test's package `path`.
 */

export interface IssuePickerOption {
	id: number;
	title: string;
	state: IssueState;
	bug_key: string | null;
	bug_url: string | null;
	/** Active rules only. */
	rules: IssueRuleRef[];
}

/**
 * A test the rule form can target: any test with results in the project,
 * found by its full package path.
 */
export interface TestPickerOption {
	id: number;
	name: string;
	/** `/`-joined package path, including the test itself. */
	path: string;
}

export type ClassifyScope = 'future' | 'oneoff';

/**
 * The matcher of the rules classifying one test's results, in the server's
 * own spelling. `/results/classify/options/` says what each may contain; the
 * form sends the parameters and tags the reader kept of it, so they are the
 * options' own, or empty, which is not matched on. The verdicts are either
 * null, for one rule ignoring them, or every verdict list the options give,
 * for a rule per list matching exactly the results with it.
 */
export interface ClassifyMatcher {
	test_id: number;
	parameters: Record<string, string>;
	verdicts: string[][] | null;
	tags: string[];
}

/** One test among the results to classify, from `/results/classify/options/`. */
export interface ClassifyOptionsTest {
	test_id: number;
	test_name: string;
	/** `/`-joined package path, including the test itself. */
	test_path: string;
	result_ids: number[];
	/** The parameters all the test's results have. */
	parameters: Record<string, string>;
	/**
	 * The different verdict lists of the test's results, in the order they
	 * first appear, each in order; `[]` for the results without verdicts. A
	 * matcher keeping the verdicts gives all of them, for a rule each.
	 */
	verdicts: string[][];
}

/**
 * What a rule classifying the results may contain. The results have to be
 * from one run, which is where the tags come from.
 */
export interface ClassifyOptions {
	run_id: number;
	tags: {
		/** The run's important tags, which a rule usually contains. */
		default: string[];
		/** The important and relevant tags; a rule may contain any of them. */
		allowed: string[];
	};
	tests: ClassifyOptionsTest[];
}

/** What the classify form knows about an issue it is about to create. */
export interface ClassifyNewIssue {
	title: string;
	description?: string | null;
	/** `ref://TRACKER/KEY`, or null for none. */
	bug_key: string | null;
}

/**
 * `POST /results/classify/`: stamps every result in `resultIds` — all from one
 * run — with a rule per test and category under one issue.
 */
export type ClassifyRequest = {
	resultIds: number[];
	projectId: number;
	/**
	 * An existing issue ID, or the data to create one. A new issue is filed
	 * under the results' own project, whatever `project` says; `bug_key` is
	 * null for none.
	 */
	issue: number | (ClassifyNewIssue & { project?: number });
	/** A rule is created for each. */
	categories: IssueCategory[];
	expected?: boolean | null;
	scope: ClassifyScope;
	/** One per test among the results. */
	matchers: ClassifyMatcher[];
};

export interface ClassifyResponse {
	issue_id: number;
	/**
	 * The rules the results were stamped with: test by test, in the order the
	 * tests first appear in `resultIds`, and within a test in the order of
	 * `categories`.
	 */
	rule_ids: number[];
}

/**
 * Authoring payloads for `/issues/` and `/issue_rules/`.
 *
 * Snake_case, like `ClassifyRequest` — these go on the wire as written, and
 * keeping them in the server's spelling is what stops a field quietly missing
 * its target. `projectId` is the exception: it is a *query* param, not a body
 * field, because `@check_action_permission('manage_issues')` reads `?project=`.
 * Creating an issue is the one write that needs the project in both places —
 * the serializer requires `project` in the body, and the endpoint copies it
 * into the query param for the permission check.
 */
export interface CreateIssueRequest {
	project: number;
	title: string;
	description?: string | null;
	/** `ref://TRACKER/KEY`, or null for none. */
	bug_key?: string | null;
}

export interface UpdateIssueRequest {
	issueId: number;
	projectId?: number;
	title?: string;
	description?: string | null;
	/**
	 * Omit entirely unless the key actually changed. The serializer's guard
	 * fires on the key being *present*, not on its value differing, so sending
	 * the current key back on an issue that has classified results is a 400.
	 */
	bug_key?: string | null;
}

/**
 * `project` is not accepted: it is read-only on the serializer
 * (`source='issue.project_id'`), so a rule's project is always its issue's.
 */
export interface CreateRuleRequest {
	projectId?: number;
	issue: number;
	test: number;
	category: IssueCategory;
	expected?: boolean | null;
	parameters: Record<string, string>;
	/** Null ignores the verdicts; `[]` matches only a failure without any. */
	verdicts: string[] | null;
	tags: string[];
}

/**
 * Category and disposition only. The matcher fields — `issue`, `test`,
 * `parameters`, `verdicts`, `tags` — are rejected *once the rule has stamps*,
 * with "Create a new rule instead"; keeping them off the body is what stops the
 * guard firing on a rule that has them. `active` is read-only and moves through
 * activate/deactivate.
 */
export interface UpdateRuleRequest {
	ruleId: number;
	projectId?: number;
	category?: IssueCategory;
	expected?: boolean | null;
}

/** An issue that classifies at least one result of a given test. */
export interface IssueSearchOption {
	id: number;
	title: string;
	bug_key: string | null;
}
