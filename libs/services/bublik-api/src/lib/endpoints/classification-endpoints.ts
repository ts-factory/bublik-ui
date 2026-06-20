/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET Labs Ltd. */
import { EndpointBuilder } from '@reduxjs/toolkit/query';

import {
	ClassifyRequest,
	Issue,
	IssueRule,
	RunIssueResultRow,
	RunIssueRow
} from '@/shared/types';

import { BUBLIK_TAG } from '../types';
import { prepareForSend } from '../utils';
import { API_REDUCER_PATH } from '../constants';
import { BublikBaseQueryFn, withApiV2 } from '../config';

export const classificationEndpoints = {
	endpoints: (
		build: EndpointBuilder<
			BublikBaseQueryFn,
			BUBLIK_TAG | string,
			API_REDUCER_PATH
		>
	) => ({
		getIssues: build.query<
			Issue[],
			{ projectId?: number; state?: string; category?: string }
		>({
			query: (args) => ({
				url: withApiV2('/issues'),
				params: {
					project: args.projectId,
					state: args.state,
					category: args.category
				},
				cache: 'no-cache'
			}),
			transformResponse: (response: { results: Issue[] }) =>
				response?.results ?? [],
			providesTags: [BUBLIK_TAG.Issues]
		}),
		getIssueRules: build.query<
			IssueRule[],
			{ projectId?: number; issue?: number }
		>({
			query: (args) => ({
				url: withApiV2('/issue-rules'),
				params: { project: args.projectId, issue: args.issue },
				cache: 'no-cache'
			}),
			transformResponse: (response: { results: IssueRule[] }) =>
				response?.results ?? [],
			providesTags: [BUBLIK_TAG.IssueRules]
		}),
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
		closeIssue: build.mutation<
			Issue,
			{ issueId: number; projectId?: number }
		>({
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
		reopenIssue: build.mutation<
			Issue,
			{ issueId: number; projectId?: number }
		>({
			query: ({ issueId, projectId }) => ({
				url: withApiV2(`/issues/${issueId}/reopen`),
				method: 'POST',
				params: { project: projectId }
			}),
			invalidatesTags: [BUBLIK_TAG.Issues, BUBLIK_TAG.Run]
		}),
		deactivateRule: build.mutation<
			IssueRule,
			{ ruleId: number; projectId?: number }
		>({
			query: ({ ruleId, projectId }) => ({
				url: withApiV2(`/issue-rules/${ruleId}/deactivate`),
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
				url: withApiV2(`/runs/${runId}/apply-rules`),
				method: 'POST',
				params: { project: projectId }
			}),
			invalidatesTags: [BUBLIK_TAG.Run, BUBLIK_TAG.ResultClassification]
		})
	})
};
