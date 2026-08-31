/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET Labs Ltd. */
import { EndpointBuilder } from '@reduxjs/toolkit/query';

import { config } from '@/bublik/config';

import {
	ClassifyRequest,
	CreateIssueRequest,
	CreateRuleRequest,
	Issue,
	IssueFacets,
	IssuePickerOption,
	IssueResultRow,
	IssueRule,
	PaginatedResponse,
	RunIssueResultRow,
	RunIssueRow,
	UpdateIssueRequest,
	UpdateRuleRequest
} from '@/shared/types';

import { BUBLIK_TAG } from '../types';
import { prepareForSend } from '../utils';
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
				params: {
					project: args.projectId,
					page: args.page,
					page_size: args.pageSize,
					state: args.state?.join(config.queryDelimiter),
					category: args.category?.join(config.queryDelimiter),
					// TODO(api): `search`, `ordering` and `rules` are sent but not
					// yet honoured — `IssueViewSet.filter_backends` is empty and
					// `get_queryset` reads only state/category/project. Until they
					// land, the search box, the Rules facet and column sorting are
					// inert on this table.
					search: args.search || undefined,
					ordering: args.ordering,
					rules: args.rules?.join(config.queryDelimiter)
				},
				cache: 'no-cache'
			}),
			// The count is the point: dropping it is what made a 45-row list
			// report "25 of 25", because page one is all the table ever saw.
			transformResponse: (response: PaginatedResponse<Issue>) =>
				normalizeList(response),
			providesTags: [BUBLIK_TAG.Issues]
		}),
		/**
		 * Facet counts over the whole filtered set, which a single page cannot
		 * answer for itself.
		 *
		 * TODO(api): `GET /issues/facets` does not exist yet; `IssuesTable` falls
		 * back to counting the rows it has and marks those counts page-local.
		 */
		getIssuesFacets: build.query<
			IssueFacets,
			{ projectId?: number; search?: string }
		>({
			query: ({ projectId, search }) => ({
				url: withApiV2('/issues/facets'),
				params: { project: projectId, search: search || undefined },
				cache: 'no-cache'
			}),
			providesTags: [BUBLIK_TAG.Issues, BUBLIK_TAG.IssueRules]
		}),
		/**
		 * Every result stamped under an issue, across runs — the issue-scoped
		 * twin of `getRunIssueResults`.
		 *
		 * TODO(api): `GET /issues/{id}/results` does not exist yet. The issues
		 * list already renders the sub-row that consumes it, so this 404s until
		 * the endpoint lands.
		 */
		getIssueResults: build.query<
			IssueResultRow[],
			{ issueId: number; projectId?: number }
		>({
			query: ({ issueId, projectId }) => ({
				url: withApiV2(`/issues/${issueId}/results`),
				params: { project: projectId },
				cache: 'no-cache'
			}),
			providesTags: [BUBLIK_TAG.ResultClassification]
		}),
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
		getIssueRules: build.query<PaginatedResponse<IssueRule>, GetIssueRulesArgs>(
			{
				query: (args) => ({
					url: withApiV2('/issue_rules'),
					params: {
						project: args.projectId,
						issue: args.issue,
						page: args.page,
						page_size: args.pageSize,
						// TODO(api): everything from here down is sent but ignored —
						// `IssueRuleViewSet` filters on project and issue only. The
						// search box, the Category/Disposition/State facets and column
						// sorting are inert on this table until they land.
						search: args.search || undefined,
						ordering: args.ordering,
						category: args.category?.join(config.queryDelimiter),
						expected: args.expected?.join(config.queryDelimiter),
						active: args.active?.join(config.queryDelimiter)
					},
					cache: 'no-cache'
				}),
				transformResponse: (response: PaginatedResponse<IssueRule>) =>
					normalizeList(response),
				providesTags: [BUBLIK_TAG.IssueRules]
			}
		),
		classifyResult: build.mutation<
			{ issue_id: number; rule_id: number },
			ClassifyRequest
		>({
			query: ({ resultId, projectId, ...body }) => ({
				url: withApiV2(`/results/${resultId}/classify`),
				method: 'POST',
				params: { project: projectId },
				body: prepareForSend(body)
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
		 * Every write below is admin-only server-side —
		 * `@check_action_permission('manage_issues')` resolves to
		 * `auth_required(as_admin=True)`, and the per-project exemption cannot
		 * name `manage_issues` (the `per_conf` schema restricts the enum). The
		 * decorator reads the project from the **query string**, which is why
		 * `project` is a param here and never a body field.
		 *
		 * The invalidation set matches `closeIssue`'s: a rule change moves the
		 * suppression map, which moves run stats, the tree and the dashboard.
		 * The server invalidates its own `RunCache` on the same events.
		 */
		createIssue: build.mutation<Issue, CreateIssueRequest>({
			query: ({ projectId, ...body }) => ({
				url: withApiV2('/issues'),
				method: 'POST',
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
		closeIssue: build.mutation<Issue, { issueId: number; projectId?: number }>({
			query: ({ issueId, projectId }) => ({
				url: withApiV2(`/issues/${issueId}/close`),
				method: 'POST',
				params: { project: projectId }
			}),
			invalidatesTags: [
				BUBLIK_TAG.Issues,
				BUBLIK_TAG.IssueRules,
				BUBLIK_TAG.Run
			]
		}),
		reopenIssue: build.mutation<Issue, { issueId: number; projectId?: number }>(
			{
				query: ({ issueId, projectId }) => ({
					url: withApiV2(`/issues/${issueId}/reopen`),
					method: 'POST',
					params: { project: projectId }
				}),
				invalidatesTags: [BUBLIK_TAG.Issues, BUBLIK_TAG.Run]
			}
		),
		deactivateRule: build.mutation<
			IssueRule,
			{ ruleId: number; projectId?: number }
		>({
			query: ({ ruleId, projectId }) => ({
				url: withApiV2(`/issue_rules/${ruleId}/deactivate`),
				method: 'POST',
				params: { project: projectId }
			}),
			invalidatesTags: [BUBLIK_TAG.IssueRules, BUBLIK_TAG.Run]
		}),
		getIssue: build.query<Issue, { issueId: number; projectId?: number }>({
			query: ({ issueId, projectId }) => ({
				url: withApiV2(`/issues/${issueId}`),
				params: { project: projectId },
				cache: 'no-cache'
			}),
			providesTags: [BUBLIK_TAG.Issues]
		}),
		activateRule: build.mutation<
			IssueRule,
			{ ruleId: number; projectId?: number }
		>({
			query: ({ ruleId, projectId }) => ({
				url: withApiV2(`/issue_rules/${ruleId}/activate`),
				method: 'POST',
				params: { project: projectId }
			}),
			invalidatesTags: [BUBLIK_TAG.IssueRules, BUBLIK_TAG.Run]
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
			RunIssueResultRow[],
			{ runId: number | string; issueId: number; projectId?: number }
		>({
			query: ({ runId, issueId, projectId }) => ({
				url: withApiV2(`/runs/${runId}/issues/${issueId}/results`),
				params: { project: projectId },
				cache: 'no-cache'
			}),
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
