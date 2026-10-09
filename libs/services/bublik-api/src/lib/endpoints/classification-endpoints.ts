/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET Labs Ltd. */
import { EndpointBuilder } from '@reduxjs/toolkit/query';

import { config } from '@/bublik/config';

import {
	BulkActionResult,
	ClassifyOptions,
	ClassifyRequest,
	ClassifyResponse,
	CreateIssueRequest,
	CreateRuleRequest,
	Issue,
	IssueFacets,
	IssueResultsFacets,
	IssueResultsResponse,
	IssueRuleFacets,
	IssuePickerOption,
	IssueRule,
	PaginatedResponse,
	RunDataResults,
	RunIssueRow,
	TestPickerOption,
	UpdateIssueRequest,
	UpdateRuleRequest
} from '@/shared/types';

import { BUBLIK_TAG } from '../types';
import { API_REDUCER_PATH } from '../constants';
import { BublikBaseQueryFn, withApiV2 } from '../config';

/**
 * Shared by both list endpoints. Multi-valued filters are joined with the same
 * delimiter the URL state uses, so a facet selection round-trips from the
 * address bar to the query string unchanged.
 */
interface ListArgs {
	projectId?: number;
	/** 1-based, as DRF counts pages. */
	page?: number;
	pageSize?: number;
	search?: string;
	/** DRF ordering: a field name, `-` prefixed for descending. */
	ordering?: string;
}

export interface GetIssuesArgs extends ListArgs {
	state?: string[];
	category?: string[];
	rules?: string[];
}

export interface GetIssueRulesArgs extends ListArgs {
	issue?: number;
	category?: string[];
	expected?: string[];
	active?: string[];
	issueState?: string[];
	/** Captured tags, as captured. */
	tags?: string[];
	verdicts?: string[];
	/** Captured parameters, as `name=value`. */
	parameters?: string[];
}

/**
 * Tolerates a bare array as well as the envelope. Not every list endpoint is
 * paginated, and a missing `pagination` block should degrade to "one page of
 * everything" rather than to a table that thinks it has no rows.
 */
function normalizeList<T>(
	response: PaginatedResponse<T> | T[]
): PaginatedResponse<T> {
	if (Array.isArray(response)) {
		return {
			results: response,
			pagination: { count: response.length, next: null, previous: null }
		};
	}

	const results = response?.results ?? [];

	return {
		results,
		pagination: response?.pagination ?? {
			count: results.length,
			next: null,
			previous: null
		}
	};
}

/**
 * A filter the server splits on `QUERY_DELIMITER` — the same `;` the URL uses.
 * Every multi-value filter on `/issues/` and `/issue_rules/` does, and rejects
 * an unknown value with a 400 rather than matching nothing.
 */
function listValued(values?: string[]): string | undefined {
	return values?.length ? values.join(config.queryDelimiter) : undefined;
}

/**
 * Params with each array value sent as its own `key=value` pair — the shape
 * the free-text filters (`tag`, `verdict`, `parameter`) take, since a verdict
 * may contain the `;` the other lists are joined with. `fetchBaseQuery` would
 * otherwise flatten an array to `a,b`.
 */
export function toSearchParams(
	params: Record<string, string | number | string[] | undefined>
): URLSearchParams {
	const search = new URLSearchParams();

	for (const [key, value] of Object.entries(params)) {
		if (value === undefined) continue;

		for (const entry of Array.isArray(value) ? value : [value]) {
			search.append(key, String(entry));
		}
	}

	return search;
}

function repeated(values?: string[]): string[] | undefined {
	return values?.length ? values : undefined;
}

/**
 * Both classified-result listings answer with `{ results: [...] }`, the shape
 * every `generate_results_details` listing uses. Tolerating a bare array too
 * costs one check and means a listing that ever drops the envelope degrades to
 * "here are the rows" rather than to a permanently empty table.
 */
type ResultListResponse = { results: RunDataResults[] } | RunDataResults[];

function unwrapResults(response: ResultListResponse): RunDataResults[] {
	if (Array.isArray(response)) return response;

	return response?.results ?? [];
}

export function issuesParams(args: GetIssuesArgs) {
	return {
		project: args.projectId,
		page: args.page,
		page_size: args.pageSize,
		search: args.search || undefined,
		ordering: args.ordering,
		state: listValued(args.state),
		category: listValued(args.category),
		rules: listValued(args.rules)
	};
}

/**
 * The facets take the list's filters and nothing else: counts describe the
 * whole filtered set, so paging and ordering have no meaning there.
 */
export type FacetArgs<T extends ListArgs> = Omit<
	T,
	'page' | 'pageSize' | 'ordering'
>;

function withoutPaging<
	T extends { page?: unknown; page_size?: unknown; ordering?: unknown }
>(params: T): Omit<T, 'page' | 'page_size' | 'ordering'> {
	const {
		page: _page,
		page_size: _pageSize,
		ordering: _ordering,
		...rest
	} = params;

	return rest;
}

export interface GetIssueResultsArgs {
	issueId: number;
	/** 1-based, as DRF counts pages. */
	page?: number;
	pageSize?: number;
	/** Obtained results; any of them. */
	results?: string[];
	/** `expected` / `unexpected`; any of them. */
	resultProperties?: string[];
	/** Stamp categories; any of them. */
	categories?: string[];
	/** The result's classification chip; any of them. */
	classifications?: string[];
	/** Every one of them. */
	verdicts?: string[];
	artifacts?: string[];
	/** `name=value`, as the rows carry them; every one of them. */
	parameters?: string[];
	/** Every one of them. */
	requirements?: string[];
}

const EMPTY_ISSUE_RESULTS_FACETS: IssueResultsFacets = {
	results: [],
	result_properties: [],
	verdicts: [],
	categories: [],
	classifications: [],
	artifacts: [],
	parameters: [],
	requirements: []
};

export function issueResultsParams(args: GetIssueResultsArgs) {
	return {
		page: args.page,
		page_size: args.pageSize,
		results: listValued(args.results),
		result_properties: listValued(args.resultProperties),
		category: listValued(args.categories),
		classification: listValued(args.classifications),
		verdict: repeated(args.verdicts),
		artifact: repeated(args.artifacts),
		parameter: repeated(args.parameters),
		requirements: listValued(args.requirements)
	};
}

export function issueRulesParams(args: GetIssueRulesArgs) {
	return {
		project: args.projectId,
		issue: args.issue,
		page: args.page,
		page_size: args.pageSize,
		search: args.search || undefined,
		ordering: args.ordering,
		active: listValued(args.active),
		category: listValued(args.category),
		expected: listValued(args.expected),
		issue_state: listValued(args.issueState),
		tag: repeated(args.tags),
		verdict: repeated(args.verdicts),
		parameter: repeated(args.parameters)
	};
}

export const classificationEndpoints = {
	endpoints: (
		build: EndpointBuilder<
			BublikBaseQueryFn,
			BUBLIK_TAG | string,
			API_REDUCER_PATH
		>
	) => ({
		getIssues: build.query<PaginatedResponse<Issue>, GetIssuesArgs>({
			query: (args) => ({
				url: withApiV2('/issues'),
				params: issuesParams(args),
				cache: 'no-cache'
			}),
			// The count is the point: dropping it is what made a 45-row list
			// report "25 of 25", because page one is all the table ever saw.
			transformResponse: (response: PaginatedResponse<Issue>) =>
				normalizeList(response),
			providesTags: [BUBLIK_TAG.Issues]
		}),
		/** Facet counts for the issues list, over the same filters it sends. */
		getIssuesFacets: build.query<IssueFacets, FacetArgs<GetIssuesArgs>>({
			query: (args) => ({
				url: withApiV2('/issues/facets'),
				params: withoutPaging(issuesParams(args)),
				cache: 'no-cache'
			}),
			providesTags: [BUBLIK_TAG.Issues, BUBLIK_TAG.IssueRules]
		}),
		/** Facet counts for the rules list, over the same filters it sends. */
		getIssueRulesFacets: build.query<
			IssueRuleFacets,
			FacetArgs<GetIssueRulesArgs>
		>({
			query: (args) => ({
				url: withApiV2('/issue_rules/facets'),
				params: toSearchParams(withoutPaging(issueRulesParams(args))),
				cache: 'no-cache'
			}),
			providesTags: [BUBLIK_TAG.IssueRules, BUBLIK_TAG.Issues]
		}),
		/**
		 * One page of the results stamped under an issue, across runs, narrowed
		 * and paged by the server. The issue-scoped twin of
		 * `getRunIssueResults`, which answers whole: an issue can stamp
		 * thousands of results, one run only so many.
		 */
		getIssueResults: build.query<IssueResultsResponse, GetIssueResultsArgs>({
			query: (args) => ({
				url: withApiV2(`/issues/${args.issueId}/results`),
				params: toSearchParams(issueResultsParams(args)),
				cache: 'no-cache'
			}),
			transformResponse: (response: Partial<IssueResultsResponse>) => ({
				pagination: response?.pagination ?? {
					page: 1,
					count: response?.results?.length ?? 0,
					next: null,
					previous: null
				},
				results: response?.results ?? []
			}),
			providesTags: [BUBLIK_TAG.ResultClassification]
		}),
		/**
		 * The values each filter of `getIssueResults` can take over the issue's
		 * results, unfiltered. They depend on the issue alone, so they are
		 * fetched once per issue view rather than with every page.
		 */
		getIssueResultsFacets: build.query<IssueResultsFacets, { issueId: number }>(
			{
				query: ({ issueId }) => ({
					url: withApiV2(`/issues/${issueId}/results/facets`),
					cache: 'no-cache'
				}),
				transformResponse: (response: Partial<IssueResultsFacets>) => ({
					...EMPTY_ISSUE_RESULTS_FACETS,
					...response
				}),
				providesTags: [BUBLIK_TAG.ResultClassification]
			}
		),
		getIssuePicker: build.query<
			IssuePickerOption[],
			{ projectId?: number; search?: string }
		>({
			query: ({ projectId, search }) => ({
				url: withApiV2('/issues/picker'),
				params: { project: projectId, search: search || undefined },
				cache: 'no-cache'
			}),
			providesTags: [BUBLIK_TAG.Issues]
		}),
		/**
		 * Tests to attach a rule to. With `search`, a substring match on the full
		 * package path (the same name can sit under different packages), capped
		 * at 20. Without it, the tests of the most recently created rules.
		 * Either way only tests with results in `project`, since the rule
		 * serializer rejects any other.
		 */
		getTestPicker: build.query<
			TestPickerOption[],
			{ projectId?: number; search?: string }
		>({
			query: ({ projectId, search }) => ({
				url: withApiV2('/tests/picker'),
				params: { project: projectId, search: search || undefined },
				cache: 'no-cache'
			}),
			// The no-search list is "recently ruled", so a new rule changes it.
			providesTags: [BUBLIK_TAG.IssueRules]
		}),
		getIssueRules: build.query<PaginatedResponse<IssueRule>, GetIssueRulesArgs>(
			{
				query: (args) => ({
					url: withApiV2('/issue_rules'),
					params: toSearchParams(issueRulesParams(args)),
					cache: 'no-cache'
				}),
				transformResponse: (response: PaginatedResponse<IssueRule>) =>
					normalizeList(response),
				providesTags: [BUBLIK_TAG.IssueRules]
			}
		),
		/**
		 * What a rule classifying these results may contain. A POST that reads:
		 * the ids go in the body, as the list can be long.
		 */
		getClassifyOptions: build.query<ClassifyOptions, { resultIds: number[] }>({
			query: ({ resultIds }) => ({
				url: withApiV2('/results/classify/options'),
				method: 'POST',
				body: { result_ids: resultIds }
			})
		}),
		classifyResult: build.mutation<ClassifyResponse, ClassifyRequest>({
			// Sent as written, **not** through `prepareForSend`: every field is
			// already in the server's spelling, and decamelizing would recurse into
			// the matchers' parameters and rewrite the tests' own parameter names —
			// silently changing what the rules match.
			query: ({ resultIds, projectId, ...body }) => ({
				url: withApiV2('/results/classify'),
				method: 'POST',
				params: { project: projectId },
				body: { result_ids: resultIds, ...body }
			}),
			invalidatesTags: [
				BUBLIK_TAG.Run,
				BUBLIK_TAG.Issues,
				BUBLIK_TAG.IssueRules,
				BUBLIK_TAG.ResultClassification,
				BUBLIK_TAG.HistoryData,
				BUBLIK_TAG.DashboardData
			]
		}),
		/**
		 * Every write below goes through `@check_action_permission('manage_issues')`:
		 * admin-only, unless the project's `per_conf` lists `manage_issues` in
		 * `NOT_PERMISSION_REQUIRED_ACTIONS`. The decorator reads the project from
		 * the **query string**, which is why `project` is a param here. Only
		 * `createIssue` also sends it in the body, because `IssueSerializer`
		 * requires it there; the others get it from the existing row.
		 *
		 * The invalidation set matches `closeIssue`'s: a rule change moves the
		 * suppression map, which moves run stats, the tree and the dashboard.
		 * The server invalidates its own `RunCache` on the same events.
		 */
		createIssue: build.mutation<Issue, CreateIssueRequest>({
			query: (body) => ({
				url: withApiV2('/issues'),
				method: 'POST',
				params: { project: body.project },
				body
			}),
			invalidatesTags: [
				BUBLIK_TAG.Issues,
				BUBLIK_TAG.IssueRules,
				BUBLIK_TAG.Run,
				BUBLIK_TAG.ResultClassification
			]
		}),
		/**
		 * PATCH, not PUT — `IssueViewSet.http_method_names` omits `put`, so a
		 * full replace is a 405.
		 *
		 * `bug_key` must be **absent** from `body` unless it changed. The
		 * serializer's guard triggers on the key appearing in the payload, not
		 * on its value differing, so echoing the current key back on an issue
		 * that already has classified results is rejected. The caller decides;
		 * this only promises not to invent the field.
		 */
		updateIssue: build.mutation<Issue, UpdateIssueRequest>({
			query: ({ issueId, projectId, ...body }) => ({
				url: withApiV2(`/issues/${issueId}`),
				method: 'PATCH',
				params: { project: projectId },
				body
			}),
			invalidatesTags: [
				BUBLIK_TAG.Issues,
				BUBLIK_TAG.IssueRules,
				BUBLIK_TAG.Run,
				BUBLIK_TAG.ResultClassification
			]
		}),
		/**
		 * Both FKs into an issue are `CASCADE`, so this takes the issue's rules
		 * and every stamp those rules laid with it. Confirm before calling.
		 */
		deleteIssue: build.mutation<void, { issueId: number; projectId?: number }>({
			query: ({ issueId, projectId }) => ({
				url: withApiV2(`/issues/${issueId}`),
				method: 'DELETE',
				params: { project: projectId }
			}),
			invalidatesTags: [
				BUBLIK_TAG.Issues,
				BUBLIK_TAG.IssueRules,
				BUBLIK_TAG.Run,
				BUBLIK_TAG.ResultClassification
			]
		}),
		/**
		 * `active` is read-only on the serializer, so a rule created here is
		 * always active — the model's default. Creating an inactive rule means
		 * following this with `deactivateRule`; `useSaveRule` does that.
		 */
		createRule: build.mutation<IssueRule, CreateRuleRequest>({
			query: ({ projectId, ...body }) => ({
				url: withApiV2('/issue_rules'),
				method: 'POST',
				params: { project: projectId },
				body
			}),
			invalidatesTags: [
				BUBLIK_TAG.IssueRules,
				BUBLIK_TAG.Issues,
				BUBLIK_TAG.Run,
				BUBLIK_TAG.ResultClassification
			]
		}),
		/**
		 * Category and disposition only. `_MATCHER_FIELDS` — project, issue,
		 * test, parameters, verdicts, tags — are rejected once the rule has
		 * stamps, with "Create a new rule instead"; the type keeps them off the
		 * body so the guard cannot fire by accident.
		 */
		updateRule: build.mutation<IssueRule, UpdateRuleRequest>({
			query: ({ ruleId, projectId, ...body }) => ({
				url: withApiV2(`/issue_rules/${ruleId}`),
				method: 'PATCH',
				params: { project: projectId },
				body
			}),
			invalidatesTags: [
				BUBLIK_TAG.IssueRules,
				BUBLIK_TAG.Issues,
				BUBLIK_TAG.Run,
				BUBLIK_TAG.ResultClassification
			]
		}),
		deleteRule: build.mutation<void, { ruleId: number; projectId?: number }>({
			query: ({ ruleId, projectId }) => ({
				url: withApiV2(`/issue_rules/${ruleId}`),
				method: 'DELETE',
				params: { project: projectId }
			}),
			invalidatesTags: [
				BUBLIK_TAG.IssueRules,
				BUBLIK_TAG.Issues,
				BUBLIK_TAG.Run,
				BUBLIK_TAG.ResultClassification
			]
		}),
		/**
		 * The four lifecycle actions are **bulk collection** routes — `POST
		 * /issues/close/` with `{ids: [...]}`, not `POST /issues/{id}/close/`.
		 * They answer with a summary rather than the mutated rows, and a row
		 * already in the requested state comes back under `unchanged`, not as an
		 * error, so a caller can send a whole selection without pre-filtering it.
		 */
		closeIssues: build.mutation<
			BulkActionResult,
			{ ids: number[]; projectId?: number }
		>({
			query: ({ ids, projectId }) => ({
				url: withApiV2('/issues/close'),
				method: 'POST',
				params: { project: projectId },
				body: { ids }
			}),
			// Closing an issue also deactivates every active rule on it, so the
			// rules list and everything downstream of suppression move with it.
			invalidatesTags: [
				BUBLIK_TAG.Issues,
				BUBLIK_TAG.IssueRules,
				BUBLIK_TAG.Run,
				BUBLIK_TAG.ResultClassification
			]
		}),
		reopenIssues: build.mutation<
			BulkActionResult,
			{ ids: number[]; projectId?: number }
		>({
			query: ({ ids, projectId }) => ({
				url: withApiV2('/issues/reopen'),
				method: 'POST',
				params: { project: projectId },
				body: { ids }
			}),
			// Reopening does *not* reactivate the rules that closing deactivated,
			// but it does restore suppression for stamps under still-active ones.
			invalidatesTags: [
				BUBLIK_TAG.Issues,
				BUBLIK_TAG.Run,
				BUBLIK_TAG.ResultClassification
			]
		}),
		deactivateRules: build.mutation<
			BulkActionResult,
			{ ids: number[]; projectId?: number }
		>({
			query: ({ ids, projectId }) => ({
				url: withApiV2('/issue_rules/deactivate'),
				method: 'POST',
				params: { project: projectId },
				body: { ids }
			}),
			// Deactivating lowers the issue's active-rule count and lifts
			// suppression from the rule's stamps.
			invalidatesTags: [
				BUBLIK_TAG.IssueRules,
				BUBLIK_TAG.Issues,
				BUBLIK_TAG.Run,
				BUBLIK_TAG.ResultClassification
			]
		}),
		activateRules: build.mutation<
			BulkActionResult,
			{ ids: number[]; projectId?: number }
		>({
			query: ({ ids, projectId }) => ({
				url: withApiV2('/issue_rules/activate'),
				method: 'POST',
				params: { project: projectId },
				body: { ids }
			}),
			// Activating raises the issue's active-rule count and restores
			// suppression for the rule's stamps.
			invalidatesTags: [
				BUBLIK_TAG.IssueRules,
				BUBLIK_TAG.Issues,
				BUBLIK_TAG.Run,
				BUBLIK_TAG.ResultClassification
			]
		}),
		getIssue: build.query<Issue, { issueId: number; projectId?: number }>({
			query: ({ issueId, projectId }) => ({
				url: withApiV2(`/issues/${issueId}`),
				params: { project: projectId },
				cache: 'no-cache'
			}),
			providesTags: [BUBLIK_TAG.Issues]
		}),
		getRunIssues: build.query<
			RunIssueRow[],
			{ runId: number | string; projectId?: number }
		>({
			query: ({ runId, projectId }) => ({
				url: withApiV2(`/runs/${runId}/issues`),
				params: { project: projectId },
				cache: 'no-cache'
			}),
			providesTags: [BUBLIK_TAG.Issues, BUBLIK_TAG.ResultClassification]
		}),
		getRunIssueResults: build.query<
			RunDataResults[],
			{ runId: number | string; issueId: number; projectId?: number }
		>({
			query: ({ runId, issueId, projectId }) => ({
				url: withApiV2(`/runs/${runId}/issues/${issueId}/results`),
				params: { project: projectId },
				cache: 'no-cache'
			}),
			// `{ results: [...] }`, like every other listing that goes through
			// `generate_results_details`. Read as a bare array it is length-zero
			// forever, which is what an expanded issue row showed.
			transformResponse: (response: ResultListResponse) =>
				unwrapResults(response),
			providesTags: [BUBLIK_TAG.ResultClassification]
		}),
		applyRulesToRun: build.mutation<
			{ stamps_created: number },
			{ runId: number | string; projectId?: number }
		>({
			query: ({ runId, projectId }) => ({
				url: withApiV2(`/runs/${runId}/apply_rules`),
				method: 'POST',
				params: { project: projectId }
			}),
			invalidatesTags: [BUBLIK_TAG.Run, BUBLIK_TAG.ResultClassification]
		})
	})
};
